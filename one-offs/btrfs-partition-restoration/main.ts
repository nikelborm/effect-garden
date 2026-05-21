import { FiniteNonNegativeInteger, simpleExec } from '@evadev/effect-helpers'
import { Btrfs } from 'effect-btrfs'

import * as Prompt from '@effect/cli/Prompt'
import * as Command from '@effect/platform/Command'
import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as BunContext from '@effect/platform-bun/BunContext'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as Console from 'effect/Console'
import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Iterable from 'effect/Iterable'
import * as Layer from 'effect/Layer'
import * as Redacted from 'effect/Redacted'
import * as Schema from 'effect/Schema'

import { pathToRegExpPattern } from './pathToRegExpPattern.ts'

const cacheFilePath = './cacheEntries.jsonl'
const homeBtrfsDevicePath = '/dev/nvme0n1p8'

const CacheValueSchema = Schema.Struct({
  stdout: Schema.String,
  stderr: Schema.String,
  exitCode: FiniteNonNegativeInteger.pipe(Schema.brand('ExitCode')),
})
type CacheValue = Schema.Schema.Type<typeof CacheValueSchema>
const decodeCacheEntries = Schema.decodeUnknownEither(
  Schema.Array(Schema.Tuple(Schema.String, CacheValueSchema)),
)

class SudoCommandExecutor extends Effect.Service<SudoCommandExecutor>()(
  'SudoCommandExecutor',
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const password = yield* Prompt.password({
        message: 'Enter your password for sudo calls: ',
        validate: value =>
          value.length === 0
            ? Effect.fail('Password cannot be empty')
            : Effect.succeed(value),
      }).pipe(Prompt.run)

      const run = (...args: string[]) =>
        EFunction.pipe(
          Command.make(
            'sudo',
            '--prompt=',
            '--stdin',
            '--reset-timestamp',
            ...args,
          ),
          Command.feed(Redacted.value(password)),
          simpleExec,
          Effect.withSpan('SudoCommandExecutor.run', {
            attributes: { args },
          }),
          Effect.scoped,
        )

      return { run }
    }),
  },
) {
  static LiveBackedByFsCache = EFunction.pipe(
    Effect.all({
      fs: FileSystem.FileSystem,
      cacheFileWriteSemaphore: Effect.makeSemaphore(1),
      defaultSudoExecutor: this,
      scope: Effect.scope,
      cache: FileSystem.FileSystem.pipe(
        Effect.flatMap(fs => fs.readFileString(cacheFilePath)),
        Effect.map(str => Bun.JSONL.parse(str)),
        Effect.flatMap(decodeCacheEntries),
        Effect.map(entries => new Map(entries)),
        Effect.orElseSucceed(() => new Map<string, CacheValue>()),
      ),
    }),
    Effect.map(req => {
      const run = Effect.fn('SudoCommandExecutorBackedByCache.run')(function* (
        ...args: string[]
      ) {
        const key = args.join()
        let value = req.cache.get(key)
        if (!value) {
          value = yield* req.defaultSudoExecutor.run(...args)
          req.cache.set(key, value)
          const addition = JSON.stringify([key, value]) + '\n'
          yield* EFunction.pipe(
            req.fs.writeFileString(cacheFilePath, addition, { flag: 'a' }),
            req.cacheFileWriteSemaphore.withPermits(1),
            Effect.forkIn(req.scope),
          )
        }
        // value is extracted, so that we can add common post-extraction logic here later
        return value
      })
      return this.make({ run })
    }),
    Layer.scoped(this),
    Layer.provide(this.Default),
  )
}

const regexpCandidates = [
  {
    regexpName: 'at_home_leveldb',
    humanReadablePatternRelativeToRoot:
      '@home/nikel/.config/google-chrome/Default/Sync Data/LevelDB',
  },
  {
    regexpName: 'leveldb',
    humanReadablePatternRelativeToRoot:
      'nikel/.config/google-chrome/Default/Sync Data/LevelDB',
  },
  {
    regexpName: 'snaphot_at_home_leveldb',
    humanReadablePatternRelativeToRoot:
      'timeshift-btrfs/snapshots/*/@home/nikel/.config/google-chrome/Default/Sync Data/LevelDB',
  },
].map(candidate => ({
  ...candidate,
  regexp: pathToRegExpPattern(candidate.humanReadablePatternRelativeToRoot),
}))

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  yield* fs.remove('out', { recursive: true, force: true })

  const roots = yield* Btrfs.findRoots({
    devicePath: homeBtrfsDevicePath,
    searchThroughAllMetadata: true,
  }).pipe(Effect.scoped)

  yield* Effect.log('All roots found:')
  yield* Console.table(roots)

  yield* fs.makeDirectory('./out', { recursive: true })

  const rootsEnriched = yield* Effect.forEach(roots, rootTreeInfo =>
    Effect.map(
      Btrfs.listRoots({
        devicePath: homeBtrfsDevicePath,
        goIntoSnapshots: true,
        ignoreErrors: true,
        treeByteNumber: rootTreeInfo.byteNumber,
      }).pipe(Effect.scoped),
      allSubRoots =>
        ({
          ...rootTreeInfo,
          allSubRoots,
          fsTreeSubRoots: Data.unsafeArray(
            allSubRoots.filter(
              subroot =>
                typeof subroot.treeObjectId === 'number' ||
                subroot.treeObjectId === 'FS_TREE',
            ),
          ),
        }) as const,
    ),
  )

  const fsTreeSubRootCandidates = Iterable.flatMap(rootsEnriched, root =>
    Iterable.map(
      root.fsTreeSubRoots,
      fsTreeRoot => ({ root, fsTreeRoot }) as const,
    ),
  )

  yield* Effect.log('FS trees to attempt recovery: ')
  yield* Console.table(
    Iterable.map(fsTreeSubRootCandidates, candidate => ({
      rootByteNumber: candidate.root.byteNumber,
      fsTreeRootByteNumber: candidate.fsTreeRoot.byteNumber,
    })),
  )

  const btrfsRestoreArgumentCandidates = Iterable.cartesianWith(
    fsTreeSubRootCandidates,
    regexpCandidates,
    (a, b) => ({ ...a, ...b }) as const,
  )

  yield* Effect.forEach(
    btrfsRestoreArgumentCandidates,
    Effect.fn('restoreAttempt')(function* ({
      root,
      fsTreeRoot,
      regexpName,
      regexp,
    }) {
      const outFolderName = `${regexpName}_${root.byteNumber}_${fsTreeRoot.byteNumber}`
      const { stdout } = yield* SudoCommandExecutor.run(
        'btrfs',
        '--verbose',
        'restore',
        '--dry-run',
        '--ignore-errors',
        '--snapshots',
        '-t',
        root.byteNumber.toString(),
        '-f',
        fsTreeRoot.byteNumber.toString(),
        '--path-regex',
        regexp,
        homeBtrfsDevicePath,
        path.join('./out', outFolderName),
      )

      const pathesWithLevelDbInThem = stdout
        .split('\n')
        .filter(line => line.endsWith('LevelDB') && !line.startsWith('Done'))

      if (pathesWithLevelDbInThem.length) {
        yield* Console.log(outFolderName)
        yield* Console.log(pathesWithLevelDbInThem.join('\n'))
        yield* Console.log()
      }
    }),
  )

  yield* Effect.log('script is done')
})

const AppLayer = Layer.provideMerge(
  SudoCommandExecutor.LiveBackedByFsCache,
  BunContext.layer,
)

program.pipe(Effect.provide(AppLayer), BunRuntime.runMain)

// await runCachedUnderSudoWithLog('btrfs inspect-internal dump-tree --help')

//! remember about OOM
// await runCachedUnderSudoWithLog(`btrfs inspect-internal dump-tree ${homeBtrfsDevicePath}`)

// sudo btrfs inspect-internal dump-tree /dev/nvme0n1p8 | grep -B300 LevelDB

// await runUnderSudo('chown', '-R', 'recov:recov', specificOut)
// cleans up empty directories
// await $`rmdir out/*/*`
