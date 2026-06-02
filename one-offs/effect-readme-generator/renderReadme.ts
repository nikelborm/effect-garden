#!/usr/bin/env node

import { RequestError } from '@octokit/request-error'
import '@total-typescript/ts-reset'
import { readFile, writeFile } from 'node:fs/promises'
import { format } from 'node:util'

import { outdent } from 'outdent'

import {
  AMOUNT_OF_COLUMNS,
  END_TOKEN,
  FATAL_PERCENT_OF_REPOS_LOST_DUE_TO_API_ERRORS,
  README_FILE_PATH,
  START_TOKEN,
} from './constants.ts'
import {
  extractReposFromMarkdownStrict,
  getEnvVarOrFail,
  getMockRepos,
  getPinsSortedByTheirProbablePopularity,
  getScaledRepaintedMarkdownPin,
  type IRepo,
  refreshScaledRepaintedPinInImagesFolder,
  renderMarkdownTableOfSmallStrings,
  selfStarredReposOfUser,
  TokenReplacer,
} from './src/index.ts'

// this is also a default environment variable provided by Github Action
export const REPO_OWNER = getEnvVarOrFail('GITHUB_REPOSITORY_OWNER')

const oldReadme = await readFile(README_FILE_PATH, 'utf8')

console.log(`Finished reading source ${README_FILE_PATH} file`)

const replacer = new TokenReplacer(oldReadme, {
  repos: [START_TOKEN, END_TOKEN],
})

const fetchedReposWithPins: {
  repo: IRepo
  pin: string
  pinRefreshPromise: Promise<void>
}[] = []

try {
  const repos =
    process.env['MOCK_API'] === 'true'
      ? await getMockRepos(REPO_OWNER)
      : selfStarredReposOfUser(REPO_OWNER)

  for await (const repo of repos) {
    console.log(
      `Found own starred repo: ${repo.name}, ${repo.lastTimeBeenPushedInto}`,
    )

    fetchedReposWithPins.push({
      repo,
      pin: getScaledRepaintedMarkdownPin(repo),
      // If you don't like rescaling and repainting, you can change it here
      // pin: getOriginalDarkThemeMarkdownPin(repo),
      pinRefreshPromise:
        process.env['SKIP_REFRESHING_IMAGES_FOLDER'] === 'true'
          ? Promise.resolve()
          : refreshScaledRepaintedPinInImagesFolder(repo),
    })
  }
} catch (error) {
  const passesGracefulDegradationCondition =
    error instanceof RequestError &&
    (() => {
      const currentMarkdownTable =
        replacer.getPartsOnFirstMatchOrThrow('repos').targetPartExcludingTokens

      const reposExtractedFromCurrentMarkdownTable =
        extractReposFromMarkdownStrict(currentMarkdownTable)

      const minReposToDownloadAndNotFail =
        (reposExtractedFromCurrentMarkdownTable.length *
          FATAL_PERCENT_OF_REPOS_LOST_DUE_TO_API_ERRORS) /
        100

      return fetchedReposWithPins.length > minReposToDownloadAndNotFail
    })()

  if (passesGracefulDegradationCondition) {
    console.error(
      outdent`
        An error was thrown during fetching data from Github API, but already
        fetched results will still be written to %s since condition
        for graceful degradation was met. It means that before failing, API
        returned more than %s%% of the repos relative to previous CI run.
      `,
      README_FILE_PATH,
      FATAL_PERCENT_OF_REPOS_LOST_DUE_TO_API_ERRORS,
    )
    console.error(error)
  } else
    throw new Error(
      format(
        outdent`
          There was an error during fetching data from Github API and condition
          for graceful degradation wasn't met. It means that before failing API
          returned LESS than %s%% of the repos relative to previous CI run.
        `,
        FATAL_PERCENT_OF_REPOS_LOST_DUE_TO_API_ERRORS,
      ),
      { cause: error },
    )
}

if (process.env['MOCK_API'] !== 'true')
  await writeFile(
    // saving it for later use to publish as Actions artifact
    './reposCreatedAndStarredByMe.json',
    JSON.stringify(
      fetchedReposWithPins.map(_ => _.repo),
      null,
      2,
    ),
  )

await Promise.all(fetchedReposWithPins.map(_ => _.pinRefreshPromise))

const newRepoMarkdownTable = renderMarkdownTableOfSmallStrings(
  getPinsSortedByTheirProbablePopularity(fetchedReposWithPins),
  AMOUNT_OF_COLUMNS,
)

const newReadme =
  replacer.updatePartBetweenFirstMatchOfTokensAndGetNewStringOrThrow(
    'repos',
    newRepoMarkdownTable,
  )

await writeFile(README_FILE_PATH, newReadme)

console.log(`Finished writing result to ${README_FILE_PATH} file`)
