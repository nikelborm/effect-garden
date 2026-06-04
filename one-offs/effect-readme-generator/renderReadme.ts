#!/usr/bin/env bun
/** biome-ignore-all lint/complexity/useLiteralKeys: bug in upstream */

import { format } from 'node:util'

import { outdent } from 'outdent'

import type { PlatformError } from '@effect/platform/Error'
import * as FetchHttpClient from '@effect/platform/FetchHttpClient'
import * as FileSystem from '@effect/platform/FileSystem'
import * as BunContext from '@effect/platform-bun/BunContext'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as EArray from 'effect/Array'
import * as Chunk from 'effect/Chunk'
import * as Config from 'effect/Config'
import * as Effect from 'effect/Effect'
import * as Either from 'effect/Either'
import * as Fiber from 'effect/Fiber'
import { flow, pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import type * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
import * as Stream from 'effect/Stream'

import {
  AMOUNT_OF_COLUMNS,
  END_TOKEN,
  FATAL_PERCENT_OF_REPOS_LOST_DUE_TO_API_ERRORS,
  README_FILE_PATH,
  START_TOKEN,
} from './src/constants.ts'
import type { FetchPinImageError, Repo } from './src/index.ts'
import {
  extractReposFromMarkdownStrict,
  getMockRepos,
  getPinsSortedByTheirProbablePopularity,
  getScaledRepaintedMarkdownPin,
  refreshScaledRepaintedPinInImagesFolder,
  renderMarkdownTableOfSmallStrings,
  selfStarredReposOfUser,
  TokenReplacer,
} from './src/index.ts'

const program = Effect.gen(function* () {
  // this is also a default environment variable provided by Github Action
  const repoOwner = yield* Config.string('GITHUB_REPOSITORY_OWNER')
  const mockApi = process.env['MOCK_API'] === 'true'
  const skipRefreshing = process.env['SKIP_REFRESHING_IMAGES_FOLDER'] === 'true'
  const renderOnlyTheme = process.env['RENDER_ONLY_THEME'] ?? ''

  const scope = yield* Effect.scope
  const pinFetchingFibers = yield* Ref.make<
    Fiber.RuntimeFiber<Option.Option<FetchPinImageError | PlatformError>>[]
  >([])

  const reposStream = pipe(
    Stream.suspend(() =>
      mockApi
        ? getMockRepos(repoOwner).pipe(
            Effect.map(flow(Chunk.map(Either.right), Stream.fromChunk)),
            Stream.unwrap,
          )
        : selfStarredReposOfUser(repoOwner),
    ),
    Stream.mapEffect(
      Effect.fnUntraced(function* (repoEither) {
        const repo = yield* repoEither

        yield* Effect.log(
          `Found own starred repo: ${repo.name}, ${repo.lastTimeBeenPushedInto}`,
        )

        if (!skipRefreshing)
          yield* refreshScaledRepaintedPinInImagesFolder(repo).pipe(
            Effect.flip,
            Effect.option,
            Effect.forkIn(scope),
            Effect.flatMap(fiber =>
              Ref.update(pinFetchingFibers, EArray.append(fiber)),
            ),
          )

        return {
          repo,
          // If you don't like rescaling and repainting, you can change it here
          // pin: getOriginalDarkThemeMarkdownPin(repo),
          pin: getScaledRepaintedMarkdownPin(repo, renderOnlyTheme),
        }
      }, Effect.either),
      { concurrency: 'unbounded', unordered: true },
    ),
  )

  const [errorStream, repoStream] = yield* Stream.partitionEither(
    reposStream,
    Effect.succeed,
  )

  const [repoFetchingErrors, repos] = yield* Effect.all(
    [Stream.runCollect(errorStream), Stream.runCollect(repoStream)],
    { concurrency: 'unbounded' },
  )

  const fs = yield* FileSystem.FileSystem

  const oldReadme = yield* fs.readFileString(README_FILE_PATH)

  const replacer = new TokenReplacer(oldReadme, {
    repos: [START_TOKEN, END_TOKEN],
  })

  if (Chunk.size(repoFetchingErrors)) {
    const okayishToDegradeGracefully = repoFetchingErrors.pipe(
      Chunk.every(error => error._tag === 'OctokitError'),
      areAllOctokitErrors => {
        const currentMarkdownTable =
          replacer.getPartsOnFirstMatchOrThrow(
            'repos',
          ).targetPartExcludingTokens

        const reposExtractedFromCurrentMarkdownTable =
          extractReposFromMarkdownStrict(currentMarkdownTable)

        const minReposToDownloadAndNotFail =
          (reposExtractedFromCurrentMarkdownTable.length *
            FATAL_PERCENT_OF_REPOS_LOST_DUE_TO_API_ERRORS) /
          100

        return (
          areAllOctokitErrors && repos.length > minReposToDownloadAndNotFail
        )
      },
    )

    if (!okayishToDegradeGracefully)
      return yield* Effect.dieMessage(
        format(
          outdent`
            There was an error during fetching data from Github API and condition
            for graceful degradation wasn't met. It means that before failing API
            returned LESS than %s%% of the repos relative to previous CI run.
          `,
          FATAL_PERCENT_OF_REPOS_LOST_DUE_TO_API_ERRORS,
        ),
      )

    yield* Effect.logError(
      outdent`
        An error was thrown during fetching data from Github API, but already
        fetched results will still be written to %s since condition
        for graceful degradation was met. It means that before failing, API
        returned more than %s%% of the repos relative to previous CI run.
      `,
      README_FILE_PATH,
      FATAL_PERCENT_OF_REPOS_LOST_DUE_TO_API_ERRORS,
    )
    yield* Effect.forEach(repoFetchingErrors, Effect.logError)
  }

  if (!mockApi)
    yield* fs.writeFileString(
      // saving it for later use to publish as Actions artifact
      './reposCreatedAndStarredByMe.json',
      JSON.stringify(
        Chunk.reduce(
          repos,
          [] as Repo[],
          (acc, { repo }) => (acc.push(repo), acc),
        ),
        null,
        2,
      ),
    )

  const pinRefreshErrorsCount = yield* pinFetchingFibers.get.pipe(
    Effect.flatMap(Fiber.joinAll),
    Effect.flatMap(flow(EArray.getSomes, Effect.forEach(Effect.logError))),
    Effect.map(EArray.length),
  )

  if (pinRefreshErrorsCount)
    return yield* Effect.dieMessage('Failed to refresh some pins')

  const newRepoMarkdownTable = renderMarkdownTableOfSmallStrings(
    getPinsSortedByTheirProbablePopularity(repos.pipe(Chunk.toArray)),
    AMOUNT_OF_COLUMNS,
  )

  const newReadme =
    replacer.updatePartBetweenFirstMatchOfTokensAndGetNewStringOrThrow(
      'repos',
      newRepoMarkdownTable,
    )

  yield* fs.writeFileString(README_FILE_PATH, newReadme)

  yield* Effect.log(`Finished writing result to ${README_FILE_PATH} file`)
})

const AppLive = Layer.merge(FetchHttpClient.layer, BunContext.layer)

program.pipe(Effect.scoped, Effect.provide(AppLive), BunRuntime.runMain)
