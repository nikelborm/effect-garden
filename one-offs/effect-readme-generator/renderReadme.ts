#!/usr/bin/env bun
/** biome-ignore-all lint/complexity/useLiteralKeys: bug in upstream */

import { format } from 'node:util'

import { outdent } from 'outdent'

import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import * as EArray from 'effect/Array'
import * as Chunk from 'effect/Chunk'
import * as Config from 'effect/Config'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as FileSystem from 'effect/FileSystem'
import * as Filter from 'effect/Filter'
import { flow, pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import type * as Option from 'effect/Option'
import type * as Path from 'effect/Path'
import type { PlatformError } from 'effect/PlatformError'
import * as Ref from 'effect/Ref'
import * as Result from 'effect/Result'
import * as Stream from 'effect/Stream'
import * as FetchHttpClient from 'effect/unstable/http/FetchHttpClient'

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
  const repoOwner = yield* Config.String('GITHUB_REPOSITORY_OWNER')
  // TODO: refactor to to take from context
  const mockApi = process.env['MOCK_API'] === 'true'
  const skipRefreshing = process.env['SKIP_REFRESHING_IMAGES_FOLDER'] === 'true'
  const renderOnlyTheme = process.env['RENDER_ONLY_THEME'] ?? ''

  const scope = yield* Effect.scope
  const pinFetchingFibers = yield* Ref.make<
    Fiber.Fiber<Option.Option<FetchPinImageError | PlatformError>>[]
  >([])

  const reposStream = pipe(
    Stream.suspend(
      (): Stream.Stream<
        Result.Result<Repo, any>,
        never,
        FileSystem.FileSystem | Path.Path
      > =>
        mockApi
          ? getMockRepos(repoOwner).pipe(
              Effect.map(chunk =>
                Stream.fromArray(
                  Chunk.toArray(chunk.pipe(Chunk.map(Result.succeed))),
                ),
              ),
              Stream.unwrap,
            )
          : selfStarredReposOfUser(repoOwner),
    ),
    Stream.mapEffect(
      Effect.fnUntraced(function* (repoResult: Result.Result<Repo, any>) {
        const repo = yield* Effect.fromResult(repoResult)

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
      }, Effect.result),
      { concurrency: 'unbounded', unordered: true },
    ),
  )

  const [errorStream, repoStream] = yield* Stream.partition(
    reposStream,
    Filter.make(
      (
        result: Result.Result<{ repo: Repo; pin: string }, any>,
      ): Result.Result<{ repo: Repo; pin: string }, any> => result,
    ),
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

  if (repoFetchingErrors.length) {
    const okayishToDegradeGracefully = pipe(
      repoFetchingErrors.every(
        (error: unknown) =>
          typeof error === 'object' &&
          error !== null &&
          '_tag' in error &&
          (error as { _tag: unknown })._tag === 'OctokitError',
      ),
      areAllOctokitErrors => {
        const currentMarkdownTable =
          replacer.getPartsOnFirstMatchOrThrow(
            'repos',
          ).targetPartExcludingTokens

        const reposExtractedFromCurrentMarkdownTable =
          extractReposFromMarkdownStrict(currentMarkdownTable)

        const minReposToDownloadAndNotFail =
          reposExtractedFromCurrentMarkdownTable.length *
          (FATAL_PERCENT_OF_REPOS_LOST_DUE_TO_API_ERRORS / 100)

        return (
          areAllOctokitErrors && repos.length > minReposToDownloadAndNotFail
        )
      },
    )

    if (!okayishToDegradeGracefully)
      return yield* Effect.die(
        new Error(
          format(
            outdent`
              There was an error during fetching data from Github API and condition
              for graceful degradation wasn't met. It means that before failing API
              returned LESS than %s%% of the repos relative to previous CI run.
            `,
            FATAL_PERCENT_OF_REPOS_LOST_DUE_TO_API_ERRORS,
          ),
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
        repos.reduce(
          (acc: Array<Repo>, { repo }) => (acc.push(repo), acc),
          [] as Array<Repo>,
        ),
        null,
        2,
      ),
    )

  const pinRefreshErrorsCount = yield* Ref.get(pinFetchingFibers).pipe(
    Effect.flatMap(Fiber.joinAll),
    Effect.flatMap(flow(EArray.getSomes, Effect.forEach(Effect.logError))),
    Effect.map(EArray.length),
  )

  if (pinRefreshErrorsCount)
    return yield* Effect.die(new Error('Failed to refresh some pins'))

  const newRepoMarkdownTable = renderMarkdownTableOfSmallStrings(
    getPinsSortedByTheirProbablePopularity(repos),
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

const AppLive = Layer.merge(FetchHttpClient.layer, BunServices.layer)

program.pipe(Effect.scoped, Effect.provide(AppLive), BunRuntime.runMain)
