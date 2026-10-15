// Binary-path cache — remembers where binaries live so kitty-shortcut
// launches with a partial PATH (no .bashrc) can still retry via absolutes.

import * as Config from 'effect/Config'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as FileSystem from 'effect/FileSystem'
import { constant, flow, identity, pipe } from 'effect/Function'
import type { TypeLambda } from 'effect/HKT'
import * as ChildProcess from 'effect/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/process/ChildProcessSpawner'
import type { ReadonlyRecord } from 'effect/Record'
import * as Schema from 'effect/Schema'
import * as Stream from 'effect/Stream'

import {
  CACHE_DIR,
  isNotFoundError,
  logAnyErrorWithNotFoundImproved,
} from './common.ts'
import {
  EffectUnified,
  type Kind3,
  StreamUnified,
  type UnifiedTypeClass,
} from './fpStuff.ts'

// TODO: Cache instead of a bunch of specific binary paths the whole environment
// PATH variable. Because opencode when it launches for the first time tries to
// launch the daemon and it can't locate proper MCP binaries installed as Bun
// dependencies like effect-mcp

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

export const startBinaryPathsCacheReading = pipe(
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
      logAnyErrorWithNotFoundImproved(
        `"which" command is not found. Cannot resolve binary pathes from PATH`,
      ),
    ),
    Effect.orDie,
  )

export const SHELL = Config.String('SHELL').pipe(Config.withDefault('bash'))

export const saveBinaryPathsCache = Effect.gen(function* () {
  const shell = yield* SHELL
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

export const withFallback =
  <F extends TypeLambda>(F: UnifiedTypeClass<F>) =>
  (cmd: ChildProcess.StandardCommand, notFoundMessage: string) =>
  <A, E extends Error, R>(
    run: (cmd: ChildProcess.StandardCommand) => Kind3<F, A, E, R>,
  ) =>
    startBinaryPathsCacheReading.pipe(
      F.fromEffect,
      F.map(flow(Fiber.join, F.fromEffect)),
      F.flatMap(cacheInF =>
        F.catchIf(run(cmd), isNotFoundError, notFoundError =>
          F.flatMap(cacheInF, ({ [cmd.command]: cachedBinPath }) =>
            cachedBinPath && cachedBinPath !== cmd.command
              ? run(ChildProcess.make(cachedBinPath, cmd.args, cmd.options))
              : F.fail<A, E, R>(notFoundError),
          ),
        ),
      ),
      // here because the first run(cmd) can give other kinds of PlatformError
      F.tapError(logAnyErrorWithNotFoundImproved(notFoundMessage)),
    )

export const withCachedBinaryFallback = withFallback(EffectUnified)

export const streamLinesWithCachedBinaryFallback = flow(
  withFallback(StreamUnified),
  runAndMapWith =>
    ChildProcessSpawner.ChildProcessSpawner.pipe(
      Effect.map(spawner => runAndMapWith(spawner.streamLines)),
      Stream.unwrap,
    ),
)
