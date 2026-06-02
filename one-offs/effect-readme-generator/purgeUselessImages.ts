#!/usr/bin/env node

import { readdir, readFile, rm } from 'node:fs/promises'

import { END_TOKEN, README_FILE_PATH, START_TOKEN } from './constants.ts'
import { getImageFileName } from './src/getPathToImageInRepo.ts'
import { extractReposFromMarkdownSoft } from './src/markdownPinToAndFrom.ts'
import { TokenReplacer } from './src/splitStringApart.ts'

const oldReadme = await readFile(README_FILE_PATH, 'utf8')

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

console.log('Expected to have image file names: ', expectedToHaveImageFileNames)

process.chdir('./images')

const presentImageFileNames = new Set(
  (await readdir('.')).filter(e => !['.gitkeep', '.gitignore'].includes(e)),
)

console.log('Present image file names: ', presentImageFileNames)

const removalTargets = presentImageFileNames.difference(
  expectedToHaveImageFileNames,
)

for (const target of removalTargets)
  await rm(target, { force: true, recursive: true })

console.log(`Deleted following files in images folder:`, removalTargets)
