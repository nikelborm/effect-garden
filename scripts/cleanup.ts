#!/usr/bin/env bun

import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import * as Cause from 'effect/Cause'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import * as Path from 'effect/Path'
import type * as PlatformError from 'effect/PlatformError'

import { passthroughSpawn } from './lib/passthroughSpawn.ts'
import { projectRootAbsolutePath } from './lib/paths.ts'
import { runDevComposeCommandThatInheritsArgs } from './lib/runDevComposeCommandInheritArgs.ts'

// TODO: add options to enable/disable node_modules, .lock and turbo stuff
// dynamically, and don't forget about changing --frozen-lockfile below
const deleteSet = new Set<string>([
  'node_modules',
  '.turbo',
  '.next',
  'build',
  'bun.lock',
  'bun.lockb',
  '__pycache__',
  'dist-types',
  'dist',
  '.swc',
  // because we don't use yarn, npm, or pnpm
  'yarn.lock',
  'package-lock.json',
  'pnpm-lock.yaml',
])

const cleanTree: (
  dirPath: string,
) => Effect.Effect<
  void,
  PlatformError.PlatformError,
  FileSystem.FileSystem | Path.Path
> = Effect.fn('cleanTree')(function* (dirPath: string) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  if (deleteSet.has(path.basename(dirPath))) {
    yield* Console.log(`Deleting: ${dirPath}`)
    yield* fs.remove(dirPath, { recursive: true, force: true })
    return
  }

  const info = yield* fs.stat(dirPath)
  if (info.type !== 'Directory') return

  const entries = yield* fs.readDirectory(dirPath)

  yield* Effect.forEach(
    entries.map(entry => path.join(dirPath, entry)),
    entry => Effect.ignore(cleanTree(entry)),
    { concurrency: 'unbounded', discard: true },
  )
})

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  yield* Console.log('Project root dir: ', projectRootAbsolutePath)

  if (projectRootAbsolutePath === '/')
    return yield* Effect.fail(
      new Error(
        "WTF??? The script assumes it's deleting files from a project root folder, but somehow we reached FS root.",
      ),
    )

  if (!(yield* fs.exists(path.join(projectRootAbsolutePath, '.git'))))
    return yield* Effect.fail(
      new Error(
        "WTF??? The script assumes it's deleting files from a project root folder, but there's no .git folder in it.",
      ),
    )

  yield* Effect.ignore(runDevComposeCommandThatInheritsArgs('stop'))

  yield* cleanTree(projectRootAbsolutePath)

  // TODO: should also add pwd, otherwise it calls install it in the current
  // directory, instead of root
  yield* passthroughSpawn(
    'bun',
    'install',
    // '--prefer-offline',
    // '--frozen-lockfile',
  )

  yield* passthroughSpawn('bun', 'turbo', 'boundaries')

  yield* passthroughSpawn('bun', 'run', 'build')
}).pipe(
  Effect.scoped,
  Effect.provide(BunServices.layer),
  Effect.withSpan(import.meta.file),
  Effect.sandbox,
  Effect.catch(e => {
    console.error(Cause.pretty(e))

    return Effect.fail(e)
  }),
)

if (import.meta.main) BunRuntime.runMain(program)
