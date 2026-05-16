/**
 * Basic example of how one would combine bliss with an "audio player"
 * through a persistent library, showing how to store extra info per song.
 *
 * For simplicity, this example recursively gets songs from a folder to
 * emulate an audio player library, without handling CUE files.
 *
 * Usage:
 *   bun examples/library_extra_info.ts init <folder> [-d db.json] [-c config.json]
 *   bun examples/library_extra_info.ts update [-c config.json]
 *   bun examples/library_extra_info.ts playlist <song> [-c config.json] [-l 20]
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, extname, join, resolve } from 'node:path'

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

interface ExtraInfo {
  extension: string | null
  fileName: string | null
  mimeType: string
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
  extraInfo: ExtraInfo
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const XDG_DATA_HOME =
  // biome-ignore lint/complexity/useLiteralKeys: because you conflict with ts
  process.env['XDG_DATA_HOME'] ?? join(homedir(), '.local', 'share')
const DEFAULT_DB_PATH = join(XDG_DATA_HOME, 'bliss-audio', 'bliss-extra.json')
const DEFAULT_CONFIG_PATH = join(
  XDG_DATA_HOME,
  'bliss-audio',
  'config-extra.json',
)

// ── Helpers ───────────────────────────────────────────────────────────────────

// Extension → MIME type mapping for common audio formats.
const AUDIO_MIME: Record<string, string> = {
  '.flac': 'audio/flac',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.opus': 'audio/opus',
  '.wma': 'audio/x-ms-wma',
  '.aiff': 'audio/aiff',
  '.ape': 'audio/ape',
  '.mpc': 'audio/musepack',
}

function mimeTypeForPath(filePath: string): string | null {
  const ext = extname(filePath).toLowerCase()
  return AUDIO_MIME[ext] ?? null
}

function extraInfoForPath(filePath: string): ExtraInfo {
  const ext = extname(filePath) || null
  return {
    extension: ext,
    fileName: basename(filePath),
    mimeType:
      AUDIO_MIME[ext?.toLowerCase() ?? ''] ?? 'application/octet-stream',
  }
}

function findAudioFilesWithInfo(
  dir: string,
): Array<{ path: string; extraInfo: ExtraInfo }> {
  const results: Array<{ path: string; extraInfo: ExtraInfo }> = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findAudioFilesWithInfo(full))
    } else {
      const mime = mimeTypeForPath(full)
      if (mime !== null) {
        results.push({ path: resolve(full), extraInfo: extraInfoForPath(full) })
      }
    }
  }
  return results
}

function songPathsWithInfo(
  config: Config,
): Array<{ path: string; extraInfo: ExtraInfo }> {
  return findAudioFilesWithInfo(config.musicLibraryPath)
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
  extraInfo: ExtraInfo,
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
      extraInfo,
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
    extraInfo,
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
      'Usage: library_extra_info.ts init <folder> [-d db.json] [-c config.json]',
    )
    process.exit(1)
  }

  const config: Config = {
    musicLibraryPath: resolve(folder),
    databasePath: resolve(databasePath),
  }

  mkdirSync(dirname(configPath), { recursive: true })
  writeFileSync(configPath, JSON.stringify(config, null, 2))

  const entries = songPathsWithInfo(config)
  const db: StoredSong[] = []

  console.log(`Analyzing ${entries.length} songs...`)
  for (const { path, extraInfo } of entries) {
    const result = analyzeSong(path)
    db.push(storedSongFromResult(path, result, extraInfo))
    if (isBlissError(result)) {
      console.error(`  failed: ${path}: ${result.message}`)
    } else {
      console.log(`  ok: ${path}`)
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

  const entries = songPathsWithInfo(config)
  const newOrFailed = entries.filter(({ path }) => {
    const entry = dbByPath.get(path)
    return !entry || entry.failed
  })

  console.log(`Re-analyzing ${newOrFailed.length} songs...`)
  for (const { path, extraInfo } of newOrFailed) {
    const result = analyzeSong(path)
    dbByPath.set(path, storedSongFromResult(path, result, extraInfo))
    if (isBlissError(result)) {
      console.error(`  failed: ${path}: ${result.message}`)
    } else {
      console.log(`  ok: ${path}`)
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
      'Usage: library_extra_info.ts playlist <song-path> [-c config.json] [-l 20]',
    )
    process.exit(1)
  }

  const config = JSON.parse(readFileSync(configPath, 'utf8')) as Config
  const db = loadDatabase(config.databasePath)

  const successfulSongs = db.filter(s => !s.failed)

  const startEntry = successfulSongs.find(
    s => s.path === resolve(songPath as string),
  )
  if (!startEntry) {
    console.error(`Song not found in library: ${songPath}`)
    process.exit(1)
  }
  const startSong = storedToSong(startEntry)

  const playlist = closestSongs(
    startSong,
    successfulSongs.map(storedToSong),
    euclideanDistance,
  ).slice(0, playlistLength)

  for (let i = 0; i < playlist.length; i++) {
    const s = playlist[i] as Song
    const stored = successfulSongs.find(e => e.path === s.path)
    const mimeType = stored?.extraInfo.mimeType ?? 'unknown'
    console.log(`${s.path} <${mimeType}>`)
  }
} else {
  console.error(
    'Usage:\n' +
      '  library_extra_info.ts init <folder> [-d db.json] [-c config.json]\n' +
      '  library_extra_info.ts update [-c config.json]\n' +
      '  library_extra_info.ts playlist <song> [-c config.json] [-l 20]',
  )
  process.exit(1)
}
