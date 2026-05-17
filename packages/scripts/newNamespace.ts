#!/usr/bin/env bun

import { prettyPrint } from 'effect-errors'

import * as Prompt from '@effect/cli/Prompt'
import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as BunContext from '@effect/platform-bun/BunContext'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as Effect from 'effect/Effect'
import * as Either from 'effect/Either'

import { myMonorepoPackagesEffect } from './fix_package_jsons.ts'
import { packagesDirPath } from './lib/paths.ts'

const emptyInternalTsNamespaceFile = `/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
`

export const namespaceDelimiter = ' '

export const listOfNamespacesPrompt = Prompt.list({
  delimiter: namespaceDelimiter,
  message:
    'Enter a list of namespaces to create empty files for, delimited by space',
  validate: value =>
    value.split(namespaceDelimiter).some(el => el.length <= 3)
      ? Either.left(
          'Some of the names are too short. Should be at least 3 characters',
        )
      : value.split(namespaceDelimiter).length === 0
        ? Either.left('Too little namespaces specified. Should be at least 1')
        : Either.right(value),
})

export const createNamespaceRelatedFiles = Effect.fn(
  'createNamespaceRelatedFiles',
)(function* (packageName: string, namespaces: string[]) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  const srcDirPath = path.join(packagesDirPath, packageName, 'src')

  yield* fs.writeFileString(
    path.join(srcDirPath, 'index.ts'),
    namespaces
      .map(namespace => `export * as ${namespace} from './${namespace}.ts'\n`)
      .join(''),
    { flag: 'a' },
  )

  yield* Effect.forEach(
    namespaces.flatMap(
      namespace =>
        [
          [
            path.join(srcDirPath, namespace + '.ts'),
            `export {} from './internal/${namespace}.ts'\n`,
          ],
          [
            path.join(srcDirPath, 'internal', namespace + '.ts'),
            emptyInternalTsNamespaceFile,
          ],
        ] as const,
    ),
    ([path, content]) => fs.writeFileString(path, content),
  )
})

const program = Effect.gen(function* () {
  const myMonorepoPackages = yield* myMonorepoPackagesEffect

  const { namespaces, packageName } = yield* Prompt.all({
    packageName: Prompt.select({
      message: `Choose a package:`,
      choices: myMonorepoPackages.map(pkg => ({
        title: pkg.myMonorepoPackage.name,
        value: pkg.directoryPath,
      })),
    }),
    namespaces: listOfNamespacesPrompt,
  }).pipe(Prompt.run)

  yield* createNamespaceRelatedFiles(packageName, namespaces)
}).pipe(
  Effect.provide(BunContext.layer),
  Effect.withSpan(import.meta.file),
  Effect.sandbox,
  Effect.catchAll(e => {
    console.error(prettyPrint(e))

    return Effect.fail(e)
  }),
)

if (import.meta.main) BunRuntime.runMain(program)
