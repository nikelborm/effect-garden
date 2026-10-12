// Binary-path cache — remembers where binaries live so kitty-shortcut
// launches with a partial PATH (no .bashrc) can still retry via absolutes.

import * as Config from 'effect/Config'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as FileSystem from 'effect/FileSystem'
import { constant, identity, pipe } from 'effect/Function'
import type { PlatformError } from 'effect/PlatformError'
import * as ChildProcess from 'effect/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/process/ChildProcessSpawner'
import type { ReadonlyRecord } from 'effect/Record'
import * as Schema from 'effect/Schema'
import * as Stream from 'effect/Stream'

import {
  CACHE_DIR,
  isNotFound,
  logErrorMessageWithBetterNotFound,
} from './common.ts'

// Binary name -> absolute path, written once via the `cache-binary-paths`
// subcommand when PATH is full (interactive terminal) and read back on later
// launches with a partial PATH (kitty shortcut without .bashrc). Tiny JSON,
// e.g. `{"opencode":"/home/nikel/.bun/bin/opencode"}`.
export const BINARY_PATHS_CACHE_FILE = `${CACHE_DIR}/binary-paths.json`

// Every binary qcode spawns in local mode. The current $SHELL value is added
// dynamically in `saveBinaryPathsCache` since it varies per machine.
export const KNOWN_BINARIES = [
  'bfs',
  'find',
  'fzf',
  'eza',
  'bat',
  'code',
  'opencode',
  'which',
  'bash',
  'sh',
  'ssh',
] as const

const BinaryPathsCache = Schema.fromJsonString(
  Schema.StructWithRest(
    Schema.Struct(
      Object.fromEntries(
        KNOWN_BINARIES.map(key => [
          key,
          Schema.optionalKey(Schema.NonEmptyString),
        ]),
      ) as ReadonlyRecord<
        (typeof KNOWN_BINARIES)[number],
        Schema.optionalKey<Schema.NonEmptyString>
      >,
    ),
    [Schema.Record(Schema.NonEmptyString, Schema.NonEmptyString)],
  ),
  { space: 2 },
)

export const readBinaryPathsCache = pipe(
  FileSystem.FileSystem.use(fs => fs.readFileString(BINARY_PATHS_CACHE_FILE)),
  Effect.flatMap(Schema.decodeEffect(BinaryPathsCache)),
  Effect.orElseSucceed(constant<typeof BinaryPathsCache.Type>({})),
  Effect.cached,
  Effect.flatMap(identity),
  Effect.forkScoped(),
)

export const which = (name: string) =>
  ChildProcessSpawner.ChildProcessSpawner.pipe(
    Effect.flatMap(spawner => spawner.string(ChildProcess.make`which ${name}`)),
    Effect.map(out => out.trim() || null),
    Effect.tapError(
      logErrorMessageWithBetterNotFound(
        `"which" command is not found. Cannot resolve binary pathes from PATH`,
      ),
    ),
    Effect.orDie,
  )

export const saveBinaryPathsCache = Effect.gen(function* () {
  const shell = yield* Config.String('SHELL').pipe(Config.withDefault('bash'))
  const names = [...new Set([...KNOWN_BINARIES, shell])]

  const entries = yield* Effect.forEach(
    names,
    name =>
      Effect.map(
        which(name),
        resolved => (resolved && ([name, resolved] as const)) || null,
      ),
    { concurrency: 'unbounded' },
  )

  const map = Object.fromEntries(entries.filter(e => !!e))
  const fs = yield* FileSystem.FileSystem

  yield* fs.makeDirectory(CACHE_DIR, { recursive: true })
  const content = yield* Schema.encodeUnknownEffect(BinaryPathsCache)(map).pipe(
    Effect.orDie,
  )
  yield* fs.writeFileString(BINARY_PATHS_CACHE_FILE, content)
  yield* Effect.log(
    `cached ${Object.keys(map).length} binary paths to ${BINARY_PATHS_CACHE_FILE}`,
  )
})

const fallback =
  <A>(
    standard: ChildProcess.StandardCommand,
    wrappedError: A,
    run: (cmd: ChildProcess.StandardCommand) => A,
  ) =>
  (cache: typeof BinaryPathsCache.Type) => {
    const cachedPath = cache[standard.command]
    return !cachedPath || cachedPath === standard.command
      ? wrappedError
      : run(ChildProcess.make(cachedPath, standard.args, standard.options))
  }

export const withCachedBinaryFallback = <A, R>(
  command: ChildProcess.StandardCommand,
  run: (
    cmd: ChildProcess.StandardCommand,
  ) => Effect.Effect<A, PlatformError, R>,
  notFoundMessage: string,
) =>
  Effect.flatMap(readBinaryPathsCache, cacheFiber =>
    command.pipe(
      run,
      Effect.catchIf(isNotFound, originalError =>
        Effect.flatMap(
          Fiber.join(cacheFiber),
          fallback(command, Effect.fail(originalError), run),
        ),
      ),
      Effect.tapError(logErrorMessageWithBetterNotFound(notFoundMessage)),
    ),
  )

export const streamLinesWithCachedBinaryFallback = (
  command: ChildProcess.StandardCommand,
  notFoundMessage: string,
) =>
  Effect.gen(function* () {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
    const cacheFiber = yield* readBinaryPathsCache

    return spawner.streamLines(command).pipe(
      Stream.catchIf(isNotFound, originalError =>
        Stream.flatMap(
          Stream.fromEffect(Fiber.join(cacheFiber)),
          fallback(command, Stream.fail(originalError), spawner.streamLines),
        ),
      ),
      Stream.tapError(logErrorMessageWithBetterNotFound(notFoundMessage)),
    )
  }).pipe(Stream.unwrap)
