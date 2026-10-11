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
import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'
import * as Stream from 'effect/Stream'

import { CACHE_DIR, isNotFound, logErrorOnNotFound } from './common.ts'

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

// Missing file, parse error, or wrong shape all mean "no cache yet" — silently
// fall back to {} so the optimistic spawn error can be reported as usual.
const BinaryPathsCache = Schema.fromJsonString(
  Schema.Record(Schema.Literals(KNOWN_BINARIES), Schema.NonEmptyString),
  { space: 2 },
)

const asd = Schema.StructWithRest(BinaryPathsCache, [
  Schema.Record(Schema.NonEmptyString, Schema.NonEmptyString),
])
// const asd: Schema.StructWithRest<
//   Schema.fromJsonString<
//     Schema.$Record<
//       Schema.Literals<readonly ["bfs", "find", "fzf", "eza", "bat", "code", "opencode", "which", "bash", "sh", "ssh"]>,
//       Schema.NonEmptyString
//     >
//   >,
//   readonly [
//     Schema.$Record<
//       Schema.NonEmptyString,
//       Schema.NonEmptyString
//     >
//   ]
// >

type Encoded = (typeof asd)['Encoded']
// type Encoded = {
//     readonly [x: number]: string;
//     readonly [x: string]: string;
//     toString: () => string;
//     charAt: (pos: number) => string;
//     charCodeAt: (index: number) => number;
//     concat: (...strings: string[]) => string;
//     indexOf: (searchString: string, position?: number) => number;
//     lastIndexOf: (searchString: string, position?: number) => number;
//     localeCompare: {
//         (that: string): number;
//         (that: string, locales?: string | string[], options?: Intl.CollatorOptions): number;
//         (that: string, locales?: Intl.LocalesArgument, options?: Intl.CollatorOptions): number;
//     };
//     ... 44 more ...;
//     toWellFormed: () => string;
// }

type Type = (typeof asd)['Type']
// type Type = {
//     readonly [x: string]: string;
//     readonly bash: string;
//     readonly bat: string;
//     readonly bfs: string;
//     readonly code: string;
//     readonly eza: string;
//     readonly find: string;
//     readonly fzf: string;
//     readonly opencode: string;
//     readonly sh: string;
//     readonly ssh: string;
//     readonly which: string;
// }

// const lll = Schema.decodeSync(asd)('')

export const readBinaryPathsCache = pipe(
  FileSystem.FileSystem.use(fs => fs.readFileString(BINARY_PATHS_CACHE_FILE)),
  Effect.flatMap(Schema.decodeEffect(BinaryPathsCache)),
  Effect.orElseSucceed(constant<ReadonlyRecord<string, string>>({})),
  Effect.cached,
  Effect.flatMap(identity),
  Effect.forkScoped(),
)

export const saveBinaryPathsCache = Effect.gen(function* () {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  const fs = yield* FileSystem.FileSystem

  const shell = yield* Config.String('SHELL').pipe(Config.withDefault('bash'))
  const names = [...new Set([...KNOWN_BINARIES, shell])]

  const entries = yield* Effect.forEach(
    names,
    name =>
      ChildProcess.make`which ${name}`.pipe(
        spawner.string,
        Effect.map(out => out.trim() || ''),
        Effect.orElseSucceed(() => ''),
        Effect.map(resolved => resolved && ([name, resolved] as const)),
      ),
    { concurrency: 'unbounded' },
  )

  const map = Record.fromEntries(entries.filter(e => e !== ''))

  yield* fs.makeDirectory(CACHE_DIR, { recursive: true })
  const content = yield* Schema.encodeEffect(BinaryPathsCache)(map)
  yield* fs.writeFileString(BINARY_PATHS_CACHE_FILE, content)
  yield* Effect.log(
    `cached ${Object.keys(map).length} binary paths to ${BINARY_PATHS_CACHE_FILE}`,
  )
})

export const withCachedBinaryFallback = Effect.fnUntraced(function* <A, R>(
  command: ChildProcess.Command,
  run: (cmd: ChildProcess.Command) => Effect.Effect<A, PlatformError, R>,
) {
  if (!ChildProcess.isStandardCommand(command)) return yield* run(command)
  const cacheFiber = yield* readBinaryPathsCache
  return yield* Effect.catchIf(run(command), isNotFound, originalError =>
    Effect.flatMap(Fiber.join(cacheFiber), cache => {
      const cachedPath = cache[command.command]
      if (!cachedPath || cachedPath === command.command)
        return Effect.fail(originalError)
      const patched = ChildProcess.make(
        cachedPath,
        command.args,
        command.options,
      )
      return run(patched)
    }),
  )
})

// Stream twin of the above, for `spawner.streamLines`. Same deal: cache reads
// in parallel, retried patch is silent on success, caller logs after both fail.
export const streamLinesWithCachedBinaryFallback = (
  command: ChildProcess.Command,
  notFoundMessage: string,
) =>
  Stream.unwrap(
    Effect.gen(function* () {
      const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
      if (!ChildProcess.isStandardCommand(command))
        return spawner
          .streamLines(command)
          .pipe(Stream.tapError(logErrorOnNotFound(notFoundMessage)))
      // Detached so returning the stream (which completes this effect) can't
      // interrupt the read before the retry joins it; Stream.ensuring below
      // cleans it up.
      const cacheFiber = yield* readBinaryPathsCache
      const retry = (originalError: PlatformError) =>
        Stream.unwrap(
          Effect.gen(function* () {
            const cache = yield* Fiber.join(cacheFiber)
            const cachedPath = cache[command.command]
            if (!cachedPath || cachedPath === command.command)
              return Stream.fail(originalError)
            const patched = ChildProcess.make(
              cachedPath,
              command.args,
              command.options,
            )
            return spawner.streamLines(patched)
          }),
        )
      return spawner
        .streamLines(command)
        .pipe(
          Stream.catchIf(isNotFound, retry),
          Stream.tapError(logErrorOnNotFound(notFoundMessage)),
          Stream.ensuring(Fiber.interrupt(cacheFiber)),
        )
    }),
  )
