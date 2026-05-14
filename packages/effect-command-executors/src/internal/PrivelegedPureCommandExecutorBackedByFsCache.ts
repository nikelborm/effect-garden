/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as FileSystem from '@effect/platform/FileSystem'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'

const baseExecutor = {} as any

const CacheValueSchema = Schema.Struct({
  stdout: Schema.String,
  stderr: Schema.String,
  exitCode: FiniteNonNegativeInteger.pipe(Schema.brand('ExitCode')),
})
type CacheValue = Schema.Schema.Type<typeof CacheValueSchema>
const decodeCacheEntries = Schema.decodeUnknownEither(
  Schema.Array(Schema.Tuple(Schema.String, CacheValueSchema)),
)

const LiveBackedByFsCache = EFunction.pipe(
  Effect.all({
    fs: FileSystem.FileSystem,
    cacheFileWriteSemaphore: Effect.makeSemaphore(1),
    defaultPrivelegedExecutor: baseExecutor,
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
    const run = Effect.fn('PrivelegedCommandExecutorBackedByCache.run')(
      function* (...args: string[]) {
        const key = args.join()
        let value = req.cache.get(key)
        if (!value) {
          value = yield* req.defaultPrivelegedExecutor.run(...args)
          req.cache.set(key, value)
          const addition = JSON.stringify([key, value]) + '\n'
          yield* pipe(
            req.fs.writeFileString(cacheFilePath, addition, { flag: 'a' }),
            req.cacheFileWriteSemaphore.withPermits(1),
            Effect.forkIn(req.scope),
          )
        }
        // value is extracted, so that we can add common post-extraction logic here later
        return value
      },
    )
    return baseExecutor.make({ run })
  }),
  Layer.scoped(baseExecutor),
  Layer.provide(baseExecutor.Default),
)
