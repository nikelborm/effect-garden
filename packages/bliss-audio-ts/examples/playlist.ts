/**
 * Analyze a folder recursively, and make a playlist out of the file
 * provided by the user.
 *
 * Usage: bun examples/playlist.ts [-o file.m3u] [-a analysis.json] <folder> <first-song>
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

import {
  analyzeSong,
  closestSongs,
  dedupPlaylist,
  euclideanDistance,
  isBlissError,
  type Song,
} from '../index.ts'

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

// Parse CLI args: [-o <playlist>] [-a <analysis>] <folder> <first-song>
const argv = Bun.argv.slice(2)
let outputPlaylist: string | null = null
let analysisFile = '/tmp/analysis.json'
const positional: string[] = []

for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '-o' || argv[i] === '--output-playlist') {
    outputPlaylist = argv[++i] ?? null
  } else if (argv[i] === '-a' || argv[i] === '--analysis-file') {
    analysisFile = argv[++i] ?? analysisFile
  } else {
    positional.push(argv[i] as string)
  }
}

const [folder, firstSongPath] = positional
if (!folder || !firstSongPath) {
  console.error(
    'Usage: bun examples/playlist.ts [-o file.m3u] [-a analysis.json] <folder> <first-song>',
  )
  process.exit(1)
}

const canonicalFirst = resolve(firstSongPath)

// Load cached analysis
let cachedSongs: Song[] = []
if (existsSync(analysisFile)) {
  cachedSongs = JSON.parse(readFileSync(analysisFile, 'utf8')) as Song[]
  for (const s of cachedSongs) {
    s.analysis.features = new Float32Array(Object.values(s.analysis.features))
  }
}

const analyzedPaths = new Set(cachedSongs.map(s => s.path))

// Find all audio files in folder
const folderPaths = findAudioFiles(folder)

// Analyze first song (may be outside folder)
const firstSongResult = analyzeSong(canonicalFirst)
if (isBlissError(firstSongResult)) {
  console.error(`error analyzing first song: ${firstSongResult.message}`)
  process.exit(1)
}
const firstSong = firstSongResult

// Analyze new songs not in cache
const newSongs: Song[] = [firstSong]
for (const p of folderPaths) {
  if (!analyzedPaths.has(p)) {
    const result = analyzeSong(p)
    if (isBlissError(result)) {
      console.error(`error analyzing ${p}: ${result.message}`)
    } else {
      newSongs.push(result)
    }
  }
}

// Persist updated analysis
const allAnalyzed = [...newSongs, ...cachedSongs]
writeFileSync(
  analysisFile,
  JSON.stringify(
    allAnalyzed.map(s => ({
      ...s,
      analysis: { ...s.analysis, features: Array.from(s.analysis.features) },
    })),
  ),
)

// Build pool: first song plus folder songs (from both new and cached)
const folderPathSet = new Set(folderPaths)
const pool = allAnalyzed.filter(
  s => s.path === canonicalFirst || folderPathSet.has(s.path),
)

// Sort by closest to first song, then dedup
const sorted = closestSongs(firstSong, pool, euclideanDistance)
const playlist = dedupPlaylist(sorted)
  .map(s => s.path)
  .join('\n')

if (outputPlaylist) {
  writeFileSync(outputPlaylist, playlist)
} else {
  console.log(playlist)
}
