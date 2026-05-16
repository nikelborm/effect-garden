/**
 * Parallel music library analyzer using 16 Bun workers.
 *
 * Scans a folder for audio files, distributes them across workers by total
 * file size (LPT scheduling), analyzes each file with bliss-audio, and
 * writes the combined Song[] result to a JSON file compatible with
 * examples/playlist.ts's analysis cache format.
 *
 * Usage: bun examples/analyze_library.ts [-o output.json] [folder]
 *   folder  defaults to /big_media/yt-music
 *   -o      output file, defaults to /tmp/library_analysis.json
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

import type { Song } from '../index.ts'
import type {
  WorkerInMessage,
  WorkerOutMessage,
} from './analyze_library_worker.ts'

const NUM_WORKERS = 5

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

// ── CLI args ──────────────────────────────────────────────────────────────────

const argv = Bun.argv.slice(2)
let outputFile = '/tmp/library_analysis.json'
let folder = '/big_media/yt-music'

for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '-o' || argv[i] === '--output') {
    outputFile = argv[++i] ?? outputFile
  } else {
    folder = argv[i] as string
  }
}

folder = resolve(folder)

// ── File discovery ────────────────────────────────────────────────────────────

function findAudioFiles(dir: string): Array<{ path: string; size: number }> {
  const results: Array<{ path: string; size: number }> = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findAudioFiles(full))
    } else if (AUDIO_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      const size = statSync(full).size
      results.push({ path: resolve(full), size })
    }
  }
  return results
}

// ── LPT distribution ──────────────────────────────────────────────────────────

function distributeBySize(
  files: Array<{ path: string; size: number }>,
  n: number,
): string[][] {
  const buckets: Array<{ paths: string[]; totalSize: number }> = Array.from(
    { length: n },
    () => ({ paths: [], totalSize: 0 }),
  )

  // Largest files first so the greedy assignment is more balanced
  const sorted = [...files].sort((a, b) => b.size - a.size)

  for (const file of sorted) {
    let minIdx = 0
    for (let i = 1; i < n; i++) {
      if (buckets[i]!.totalSize < buckets[minIdx]!.totalSize) minIdx = i
    }
    buckets[minIdx]!.paths.push(file.path)
    buckets[minIdx]!.totalSize += file.size
  }

  return buckets.map(b => b.paths)
}

// ── Progress display ──────────────────────────────────────────────────────────

function formatProgress(
  workerProgress: Array<{ done: number; total: number }>,
  totalDone: number,
  totalFiles: number,
  errors: number,
): string {
  const pct = totalFiles > 0 ? Math.round((totalDone / totalFiles) * 100) : 0
  const workerLine = workerProgress
    .map((w, i) => `W${i + 1}:${w.done}/${w.total}`)
    .join(' ')
  return `[${pct}%] ${totalDone}/${totalFiles} analyzed, ${errors} errors | ${workerLine}`
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`Scanning ${folder} ...`)
const files = findAudioFiles(folder)
console.log(`Found ${files.length} audio files`)

if (files.length === 0) {
  console.error('No audio files found.')
  process.exit(1)
}

const batches = distributeBySize(files, NUM_WORKERS)

const totalSongs: Song[] = []
const errors: Array<{ path: string; tag: string; message: string }> = []
const workerProgress = Array.from({ length: NUM_WORKERS }, () => ({
  done: 0,
  total: 0,
}))

let doneWorkers = 0
let totalDone = 0

const workerUrl = new URL('./analyze_library_worker.ts', import.meta.url)

const allDone = new Promise<void>(resolveAll => {
  for (let i = 0; i < NUM_WORKERS; i++) {
    const batch = batches[i] ?? []

    if (batch.length === 0) {
      doneWorkers++
      if (doneWorkers === NUM_WORKERS) resolveAll()
      continue
    }

    workerProgress[i] = { done: 0, total: batch.length }

    const worker = new Worker(workerUrl, { type: 'module' })

    worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
      const msg = event.data
      switch (msg.type) {
        case 'result':
          totalSongs.push(msg.song)
          break
        case 'error':
          errors.push({ path: msg.path, tag: msg.tag, message: msg.message })
          break
        case 'progress':
          workerProgress[msg.workerId] = { done: msg.done, total: msg.total }
          totalDone = workerProgress.reduce((s, w) => s + w.done, 0)
          process.stdout.write(
            `\r${formatProgress(workerProgress, totalDone, files.length, errors.length)}`,
          )
          break
        case 'done':
          doneWorkers++
          worker.terminate()
          if (doneWorkers === NUM_WORKERS) resolveAll()
          break
      }
    }

    worker.onerror = err => {
      console.error(`\nWorker ${i} error:`, err.message)
      doneWorkers++
      worker.terminate()
      if (doneWorkers === NUM_WORKERS) resolveAll()
    }

    worker.postMessage({ workerId: i, paths: batch } satisfies WorkerInMessage)
  }
})

await allDone

process.stdout.write('\n')
console.log(
  `Analysis complete: ${totalSongs.length} songs, ${errors.length} errors`,
)

if (errors.length > 0) {
  console.error('Failed files:')
  for (const e of errors) {
    console.error(`  [${e.tag}] ${e.path}: ${e.message}`)
  }
}

// Serialize exactly as playlist.ts does: features as plain number array
writeFileSync(
  outputFile,
  JSON.stringify(
    totalSongs.map(s => ({
      ...s,
      analysis: { ...s.analysis, features: Array.from(s.analysis.features) },
    })),
  ),
)
console.log(`Wrote ${outputFile}`)
