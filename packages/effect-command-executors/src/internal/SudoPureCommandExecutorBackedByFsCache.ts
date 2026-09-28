/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

// TODO: this module is an unfinished idea (pre-existing, not a v3 -> v4
// rename): it referenced an undeclared `cacheFilePath`, a `Bun` global without
// `@types/bun`, a bare `pipe` import, `{} as any` executors, and v3-only APIs
// (`Effect.makeSemaphore` -> `Semaphore.make`, `Layer.scoped` -> `Layer.effect`,
// `Schema.decodeUnknownEither` -> `Schema.decodeUnknownExit/Effect`,
// `@effect/platform/FileSystem` -> `effect/FileSystem`). It is intentionally
// stubbed to `export {}` so `tsc` passes until the cache design (key format,
// ExitCode schema, semaphore/scope handling, Bun vs Node FS) is specified.
// See also the empty stubs CommandUtils.ts and
// PureCommandExecutorBackedByPermanentFsCache.ts.
export {}
