// PATH cache — remembers full $PATH so kitty-shortcut launches with a partial
// PATH (no .bashrc) still spawn with the cached value. Spawning with the
// full PATH (instead of an absolute binary path) also fixes opencode's
// daemon: opencode itself gets the full PATH, so its children (MCP binaries
// like effect-mcp from bun deps) inherit it too.

import * as Config from 'effect/Config'
import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import { constant, flow, identity, pipe } from 'effect/Function'
import type { TypeLambda } from 'effect/HKT'
import * as ChildProcess from 'effect/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/process/ChildProcessSpawner'
import * as Stream from 'effect/Stream'

import { CACHE_DIR, logAnyErrorWithNotFoundImproved } from './common.ts'
import {
  EffectUnified,
  type Kind3,
  StreamUnified,
  type UnifiedTypeClass,
} from './fpStuff.ts'

// Full $PATH, written once via the `cache-path` subcommand when PATH is full
// (interactive terminal) and read back on later launches with a partial PATH
// (kitty shortcut without .bashrc). Plain text, e.g. `/home/nikel/.bun/bin:...`.
export const PATH_CACHE_FILE = `${CACHE_DIR}/PATH.txt`

export const PATH = Config.String('PATH')

export const SHELL = Config.String('SHELL').pipe(Config.withDefault('bash'))

export const getCachedPATH = pipe(
  FileSystem.FileSystem.use(fs => fs.readFileString(PATH_CACHE_FILE)),
  Effect.map(s => s || null),
  Effect.orElseSucceed(constant(null)),
  Effect.cached,
  Effect.flatMap(identity),
)

const withFullPath = (cmd: ChildProcess.StandardCommand, fullPath: string) =>
  ChildProcess.setEnv(
    ChildProcess.make(cmd.command, cmd.args, {
      ...cmd.options,
      extendEnv: true,
    }),
    { PATH: fullPath },
  ) as ChildProcess.StandardCommand

export const savePathCache = Effect.gen(function* () {
  const fullPath = (yield* PATH).trim()
  if (!fullPath)
    return yield* Effect.die('current PATH is empty, nothing to cache')

  const fs = yield* FileSystem.FileSystem

  yield* fs.makeDirectory(CACHE_DIR, { recursive: true })
  yield* fs.writeFileString(PATH_CACHE_FILE, fullPath)
  yield* Effect.log(
    `cached PATH (${fullPath.length} chars) to ${PATH_CACHE_FILE}`,
  )
})

export const withPATHResolver =
  <F extends TypeLambda>(F: UnifiedTypeClass<F>) =>
  (cmd: ChildProcess.StandardCommand, notFoundMessage: string) =>
  <A, E extends Error, R>(
    run: (cmd: ChildProcess.StandardCommand) => Kind3<F, A, E, R>,
  ) =>
    getCachedPATH.pipe(
      F.fromEffect,
      F.flatMap(cachedPATH =>
        run(cachedPATH ? withFullPath(cmd, cachedPATH) : cmd),
      ),
      F.tapError(logAnyErrorWithNotFoundImproved(notFoundMessage)),
    )

export const withCachedPATHResolver = withPATHResolver(EffectUnified)

export const streamLinesWithCachedPATHResolver = flow(
  withPATHResolver(StreamUnified),
  runAndMapWith =>
    ChildProcessSpawner.ChildProcessSpawner.pipe(
      Effect.map(spawner => runAndMapWith(spawner.streamLines)),
      Stream.unwrap,
    ),
)

export const which = (name: string) =>
  ChildProcessSpawner.ChildProcessSpawner.use(spawner =>
    withCachedPATHResolver(
      ChildProcess.make`which ${name}`,
      `"which" command is not found. Cannot resolve binary paths from PATH`,
    )(spawner.string),
  ).pipe(
    Effect.map(out => out.trim() || null),
    Effect.orDie,
  )
