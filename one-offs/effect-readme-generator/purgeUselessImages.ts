#!/usr/bin/env bun

import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as BunContext from '@effect/platform-bun/BunContext'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as Effect from 'effect/Effect'

import { END_TOKEN, README_FILE_PATH, START_TOKEN } from './src/constants.ts'
import { getImageFileName } from './src/getPathToImageInRepo.ts'
import { extractReposFromMarkdownSoft } from './src/markdownPinToAndFrom.ts'
import { TokenReplacer } from './src/splitStringApart.ts'

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  const oldReadme = yield* fs.readFileString(README_FILE_PATH)

  const replacer = new TokenReplacer(oldReadme, {
    repos: [START_TOKEN, END_TOKEN],
  })

  const reposMarkdownTableString =
    replacer.getPartsOnFirstMatchOrThrow('repos').targetPartExcludingTokens

  const expectedToHaveImageFileNames = new Set(
    extractReposFromMarkdownSoft(reposMarkdownTableString)
      .filter(e => e.imageHost === 'raw.githubusercontent.com')
      .map(e =>
        getImageFileName({ name: e.repoName, owner: e.username }, e.themeName),
      ),
  )

  yield* Effect.log(
    'Expected to have image file names: ',
    expectedToHaveImageFileNames,
  )

  const presentImageFileNames = new Set(
    (yield* fs.readDirectory('./images')).filter(
      e => !['.gitkeep', '.gitignore'].includes(e),
    ),
  )

  yield* Effect.log('Present image file names: ', presentImageFileNames)

  const removalTargets = presentImageFileNames.difference(
    expectedToHaveImageFileNames,
  )

  yield* Effect.forEach(
    removalTargets,
    target => fs.remove(path.join('images', target), { recursive: true }),
    { concurrency: 'unbounded' },
  )

  yield* Effect.log('Deleted following files in images folder:', removalTargets)
})

program.pipe(Effect.provide(BunContext.layer), BunRuntime.runMain)
