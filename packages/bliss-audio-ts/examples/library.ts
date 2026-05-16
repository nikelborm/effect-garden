/**
 * Basic example of how one would combine bliss with an "audio player"
 * through a persistent library backed by a JSON database.
 *
 * For simplicity, this example recursively gets songs from a folder to
 * emulate an audio player library, without handling CUE files.
 *
 * Usage:
 *   bun examples/library.ts init <folder> [-d db.json] [-c config.json]
 *   bun examples/library.ts update [-c config.json]
 *   bun examples/library.ts playlist <song> [-c config.json] [-l 20]
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'

import {
  analyzeSong,
  type BlissError,
  closestSongs,
  euclideanDistance,
  isBlissError,
  type Song,
} from '../index.ts'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Config {
  musicLibraryPath: string
  databasePath: string
}

interface StoredSong {
  path: string
  artist: string | null
  title: string | null
  album: string | null
  albumArtist: string | null
  trackNumber: number | null
  discNumber: number | null
  genre: string | null
  durationSecs: number
  features: number[]
  featuresVersion: number
  failed: boolean
  errorMessage?: string
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const XDG_DATA_HOME =
  // biome-ignore lint/complexity/useLiteralKeys: because you conflict with ts
  process.env['XDG_DATA_HOME'] ?? join(homedir(), '.local', 'share')
const DEFAULT_DB_PATH = join(XDG_DATA_HOME, 'bliss-audio', 'bliss.json')
const DEFAULT_CONFIG_PATH = join(XDG_DATA_HOME, 'bliss-audio', 'config.json')

// ── Helpers ───────────────────────────────────────────────────────────────────

const AUDIO_EXTENSIONS = new Set([
  '.flac',
  '.mp3',
  '.ogg',
  '.wav',
  '.m4a',
  '.aac',
  '.opus',
  '.wma',
  '.aiff',
  '.ape',
  '.mpc',
])

function findAudioFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findAudioFiles(full))
    } else if (AUDIO_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      results.push(resolve(full))
    }
  }
  return results
}

function songPaths(config: Config): string[] {
  return findAudioFiles(config.musicLibraryPath)
}

function loadDatabase(dbPath: string): StoredSong[] {
  if (!existsSync(dbPath)) return []
  return JSON.parse(readFileSync(dbPath, 'utf8')) as StoredSong[]
}

function saveDatabase(dbPath: string, songs: StoredSong[]): void {
  mkdirSync(dirname(dbPath), { recursive: true })
  writeFileSync(dbPath, JSON.stringify(songs, null, 2))
}

function storedSongFromResult(
  path: string,
  result: Song | BlissError,
): StoredSong {
  if (isBlissError(result)) {
    return {
      path,
      artist: null,
      title: null,
      album: null,
      albumArtist: null,
      trackNumber: null,
      discNumber: null,
      genre: null,
      durationSecs: 0,
      features: [],
      featuresVersion: 0,
      failed: true,
      errorMessage: result.message,
    }
  }
  return {
    path: result.path,
    artist: result.artist ?? null,
    title: result.title ?? null,
    album: result.album ?? null,
    albumArtist: result.albumArtist ?? null,
    trackNumber: result.trackNumber ?? null,
    discNumber: result.discNumber ?? null,
    genre: result.genre ?? null,
    durationSecs: result.durationSecs,
    features: Array.from(result.analysis.features),
    featuresVersion: result.analysis.featuresVersion,
    failed: false,
  }
}

function storedToSong(s: StoredSong): Song {
  return {
    path: s.path,
    ...(s.artist !== null ? { artist: s.artist } : {}),
    ...(s.title !== null ? { title: s.title } : {}),
    ...(s.album !== null ? { album: s.album } : {}),
    ...(s.albumArtist !== null ? { albumArtist: s.albumArtist } : {}),
    ...(s.trackNumber !== null ? { trackNumber: s.trackNumber } : {}),
    ...(s.discNumber !== null ? { discNumber: s.discNumber } : {}),
    ...(s.genre !== null ? { genre: s.genre } : {}),
    durationSecs: s.durationSecs,
    analysis: {
      features: new Float32Array(s.features),
      featuresVersion: s.featuresVersion as 1 | 2,
    },
    featuresVersion: s.featuresVersion as 1 | 2,
  }
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const [subcommand, ...rest] = Bun.argv.slice(2)

if (subcommand === 'init') {
  // init <folder> [-d db-path] [-c config-path]
  let folder: string | undefined
  let databasePath = DEFAULT_DB_PATH
  let configPath = DEFAULT_CONFIG_PATH

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '-d' || rest[i] === '--database-path') {
      databasePath = rest[++i] ?? databasePath
    } else if (rest[i] === '-c' || rest[i] === '--config-path') {
      configPath = rest[++i] ?? configPath
    } else {
      folder = rest[i]
    }
  }

  if (!folder) {
    console.error(
      'Usage: library.ts init <folder> [-d db.json] [-c config.json]',
    )
    process.exit(1)
  }

  const config: Config = {
    musicLibraryPath: resolve(folder),
    databasePath: resolve(databasePath),
  }

  mkdirSync(dirname(configPath), { recursive: true })
  writeFileSync(configPath, JSON.stringify(config, null, 2))

  const paths = songPaths(config)
  const db: StoredSong[] = []

  console.log(`Analyzing ${paths.length} songs...`)
  for (const p of paths) {
    const result = analyzeSong(p)
    db.push(storedSongFromResult(p, result))
    if (isBlissError(result)) {
      console.error(`  failed: ${p}: ${result.message}`)
    } else {
      console.log(`  ok: ${p}`)
    }
  }

  saveDatabase(config.databasePath, db)
  console.log(`Saved ${db.length} entries to ${config.databasePath}`)
} else if (subcommand === 'update') {
  // update [-c config-path]
  let configPath = DEFAULT_CONFIG_PATH

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '-c' || rest[i] === '--config-path') {
      configPath = rest[++i] ?? configPath
    }
  }

  const config = JSON.parse(readFileSync(configPath, 'utf8')) as Config
  const db = loadDatabase(config.databasePath)
  const dbByPath = new Map(db.map(s => [s.path, s]))

  const paths = songPaths(config)
  const newOrFailed = paths.filter(p => {
    const entry = dbByPath.get(p)
    return !entry || entry.failed
  })

  console.log(`Re-analyzing ${newOrFailed.length} songs...`)
  for (const p of newOrFailed) {
    const result = analyzeSong(p)
    dbByPath.set(p, storedSongFromResult(p, result))
    if (isBlissError(result)) {
      console.error(`  failed: ${p}: ${result.message}`)
    } else {
      console.log(`  ok: ${p}`)
    }
  }

  saveDatabase(config.databasePath, [...dbByPath.values()])
  console.log('Library updated.')
} else if (subcommand === 'playlist') {
  // playlist <song-path> [-c config-path] [-l playlist-length]
  let songPath: string | undefined
  let configPath = DEFAULT_CONFIG_PATH
  let playlistLength = 20

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '-c' || rest[i] === '--config-path') {
      configPath = rest[++i] ?? configPath
    } else if (rest[i] === '-l' || rest[i] === '--playlist-length') {
      playlistLength = parseInt(rest[++i] ?? '20', 10)
    } else {
      songPath = rest[i]
    }
  }

  if (!songPath) {
    console.error(
      'Usage: library.ts playlist <song-path> [-c config.json] [-l 20]',
    )
    process.exit(1)
  }

  const config = JSON.parse(readFileSync(configPath, 'utf8')) as Config
  const db = loadDatabase(config.databasePath)

  const successfulSongs = db.filter(s => !s.failed).map(storedToSong)

  const startSong = successfulSongs.find(
    s => s.path === resolve(songPath as string),
  )
  if (!startSong) {
    console.error(`Song not found in library: ${songPath}`)
    process.exit(1)
  }

  const playlist = closestSongs(
    startSong,
    successfulSongs,
    euclideanDistance,
  ).slice(0, playlistLength)

  for (const s of playlist) {
    console.log(JSON.stringify(s.path))
  }
} else {
  console.error(
    'Usage:\n' +
      '  library.ts init <folder> [-d db.json] [-c config.json]\n' +
      '  library.ts update [-c config.json]\n' +
      '  library.ts playlist <song> [-c config.json] [-l 20]',
  )
  process.exit(1)
}
