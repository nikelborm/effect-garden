#!/usr/bin/env bun

import * as Prompt from '@effect/cli/Prompt'
import * as FileSystem from '@effect/platform/FileSystem'
import * as BunContext from '@effect/platform-bun/BunContext'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as Effect from 'effect/Effect'

Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem

  const procEntries = yield* fs.readDirectory('/proc')

  const pids = procEntries.filter(e => /^\d+$/.test(e)).map(Number)

  const matchingPids: number[] = []

  for (const pid of pids) {
    const cmdline: string = yield* fs
      .readFileString(`/proc/${pid}/cmdline`)
      .pipe(Effect.catchAll(() => Effect.succeed('')))

    if (cmdline.replace(/\0/g, ' ').includes('bun server.ts'))
      matchingPids.push(pid)
  }

  if (matchingPids.length === 0) {
    console.log('No processes found with "bun server.ts" in command line.')
    return
  }

  for (const targetPid of matchingPids) {
    const tree: number[] = []
    const visited = new Set<number>()
    let cursor = targetPid

    while (cursor > 1 && !visited.has(cursor)) {
      visited.add(cursor)
      tree.unshift(cursor)
      const status: string = yield* fs
        .readFileString(`/proc/${cursor}/status`)
        .pipe(Effect.catchAll(() => Effect.succeed('')))
      const ppidMatch = status.match(/^PPid:\s*(\d+)/m)
      if (!ppidMatch) break
      cursor = parseInt(ppidMatch[1]!, 10)
    }

    console.log(
      `\n${'═'.repeat(60)}\nProcess tree for PID ${targetPid} (root → target)\n${'═'.repeat(60)}`,
    )

    for (const pid of tree) {
      const status: string = yield* fs
        .readFileString(`/proc/${pid}/status`)
        .pipe(Effect.catchAll(() => Effect.succeed('')))

      const cmdline: string = yield* fs
        .readFileString(`/proc/${pid}/cmdline`)
        .pipe(Effect.catchAll(() => Effect.succeed('')))

      const environ: string = yield* fs
        .readFileString(`/proc/${pid}/environ`)
        .pipe(Effect.catchAll(() => Effect.succeed('')))

      const name = status.match(/^Name:\s*(.+)/m)?.[1] ?? '?'
      const ppid = status.match(/^PPid:\s*(\d+)/m)?.[1] ?? '?'
      const uid = status.match(/^Uid:\s*(.+)/m)?.[1] ?? '?'
      const gid = status.match(/^Gid:\s*(.+)/m)?.[1] ?? '?'
      const vmRss = status.match(/^VmRSS:\s*(.+)/m)?.[1] ?? 'N/A'
      const threads = status.match(/^Threads:\s*(\d+)/m)?.[1] ?? '?'
      const state = status.match(/^State:\s*(.+)/m)?.[1] ?? '?'

      const args = cmdline.split('\0').filter(Boolean)
      const envVars = environ.split('\0').filter(Boolean)

      const marker = pid === targetPid ? ' ◀ TARGET' : ''

      console.log(`\n┌─ PID: ${pid}${marker}`)
      console.log(`│  Name:    ${name}`)
      console.log(`│  PPid:    ${ppid}`)
      console.log(`│  State:   ${state}`)
      console.log(`│  Uid:     ${uid}`)
      console.log(`│  Gid:     ${gid}`)
      console.log(`│  Threads: ${threads}`)
      console.log(`│  VmRSS:   ${vmRss}`)
      console.log(`│  Command: ${args.join(' ')}`)
      console.log(`│  Env (${envVars.length} vars)`)
      console.log('└' + '─'.repeat(59))
    }

    const confirmed = yield* Prompt.run(
      Prompt.confirm({
        message: `Kill PID ${targetPid} with SIGKILL (signal 9)?`,
        initial: false,
      }),
    )

    if (confirmed) {
      process.kill(targetPid, 9)
      console.log(`Sent SIGKILL to PID ${targetPid}.`)
    } else {
      console.log(`Skipped PID ${targetPid}.`)
    }
  }
}).pipe(Effect.provide(BunContext.layer), BunRuntime.runMain)
