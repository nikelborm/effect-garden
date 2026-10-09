#!/usr/bin/env bun

import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import * as Path from 'effect/Path'
import * as Result from 'effect/Result'

const SRC_DIR = 'packages_dirty'
const DEST_DIR = 'packages'

const getObjectSortedByKeys = (obj: Exclude<object, null>) =>
  Object.fromEntries(
    Object.entries(obj).sort((a, b) => a[0].localeCompare(b[0])),
  )

const writeOnlyRelevantDepsFieldsToNewFile = Effect.fn(
  'writeOnlyRelevantDepsFieldsToNewFile',
)(function* (fromFilePath: string, toFilePath: string) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  const content = yield* fs.readFileString(fromFilePath)
  const pkg = JSON.parse(content)

  const filtered: Record<string, any> = {}

  for (const key of [
    'name',
    'type',
    'workspaces',
    'patchedDependencies',
    'catalog',
  ])
    if (key in pkg)
      filtered[key] =
        typeof pkg[key] === 'object' &&
        pkg[key] !== null &&
        !Array.isArray(pkg[key])
          ? getObjectSortedByKeys(pkg[key])
          : pkg[key]

  if ('dependencies' in pkg || 'devDependencies' in pkg) {
    const pkgDeps = pkg.dependencies || {}
    const pkgDevDeps = pkg.devDependencies || {}
    const commonDependencyNames = new Set(Object.keys(pkgDeps)).intersection(
      new Set(Object.keys(pkgDevDeps)),
    )

    if (commonDependencyNames.size)
      return yield* Effect.fail(
        new Error(
          `Found dependencies specified in both devDependencies and dependencies: ${[
            ...commonDependencyNames.keys(),
          ]}}`,
        ),
      )

    // for (const key of ['dependencies', 'devDependencies']) {
    //   if (!(key in pkg)) continue;

    //   filtered[key] = Object.fromEntries(
    //     Object.entries(pkg[key]).sort((a, b) => a[0].localeCompare(b[0])),
    //   );
    // }

    // The piece of code below, which I (@evadev) wrote, I believe will
    // generate more hash-stable package.json files. But if it will trigger
    // --frozen-lockfile of bun, I'm open to change it back to commented piece
    // above. Before changing it back, don't forget to just try `bun install` in
    // repo root. If it won't fix the problem during container builds, swap
    // commented parts in this script
    // biome-ignore lint/complexity/useLiteralKeys: <explanation>
    filtered['dependencies'] = getObjectSortedByKeys({
      ...pkg.dependencies,
      ...pkg.devDependencies,
    })
  }

  yield* fs.makeDirectory(path.dirname(toFilePath), { recursive: true })
  yield* fs.writeFileString(
    toFilePath,
    JSON.stringify(filtered, null, 2) + '\n',
  )
})

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  const sourceDirEntries = yield* fs.readDirectory(SRC_DIR)
  const potentialFullPackageJsonPaths = sourceDirEntries.map(entry =>
    path.join(SRC_DIR, entry, 'package.json'),
  )

  const existingPackageJsonPaths = yield* Effect.filterMapEffect(
    potentialFullPackageJsonPaths,
    candidate =>
      Effect.map(fs.stat(candidate), info =>
        info.type === 'File' ? Result.succeed(candidate) : Result.failVoid,
      ),
    { concurrency: 'unbounded' },
  )

  yield* Effect.forEach(
    existingPackageJsonPaths,
    Effect.fnUntraced(function* (dirtyPackageJsonFilePath) {
      const cleanPackageJsonFilePath = dirtyPackageJsonFilePath.replace(
        SRC_DIR,
        DEST_DIR,
      )
      const destDir = path.dirname(cleanPackageJsonFilePath)

      yield* fs.makeDirectory(destDir, { recursive: true })

      yield* writeOnlyRelevantDepsFieldsToNewFile(
        dirtyPackageJsonFilePath,
        cleanPackageJsonFilePath,
      )
    }),
    { concurrency: 'unbounded', discard: true },
  )

  yield* writeOnlyRelevantDepsFieldsToNewFile(
    './package.json',
    './package.json',
  )
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
