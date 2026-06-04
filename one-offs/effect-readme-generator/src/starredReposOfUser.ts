import { Octokit } from '@octokit/core'
import type { RequestError } from '@octokit/request-error'

import * as Chunk from 'effect/Chunk'
import * as Effect from 'effect/Effect'
import * as Either from 'effect/Either'
import { flow } from 'effect/Function'
import * as Stream from 'effect/Stream'
import * as Struct from 'effect/Struct'

import { addOrdinalSuffixTo } from './addOrdinalSuffixToNumber.ts'
import { OctokitError } from './errors.ts'
import { parseLinkHeader } from './parseLinkHeader.ts'
import { Repo } from './repo.interface.ts'

const distributeChunkSuccess: <E>(
  self: Either.Either<{ repos: Chunk.Chunk<Repo> }, E>,
) => Chunk.Chunk<Either.Either<Repo, E>> = Either.match({
  onRight: flow(Struct.get('repos'), Chunk.map(Either.right)),
  onLeft: flow(Either.left, Chunk.make),
})

export const starredReposOfUser = (username: string, reposPerPage: number) =>
  Effect.gen(function* () {
    yield* Effect.log(`Started fetching pages of ${username}'s starred repos`)

    const requestPageOfStarredRepos = yield* makeRequesterOfStarredReposPage(
      username,
      reposPerPage,
    )

    const firstPageEither = yield* Effect.either(requestPageOfStarredRepos(1))

    if (Either.isLeft(firstPageEither))
      return Stream.succeed(Either.left(firstPageEither.left))

    const firstPageStream = firstPageEither.pipe(
      distributeChunkSuccess,
      Stream.fromChunk,
    )

    const firstPage = firstPageEither.right

    const lastPageIndex =
      firstPage.linkHeader.last?.page ?? firstPage.linkHeader.next?.page

    if (!lastPageIndex) {
      yield* Effect.log(
        'Fetched the first page, which is also the only one here',
      )
      return firstPageStream
    }

    yield* Effect.log(`Fetched the first out of ${lastPageIndex} pages`)

    const remainingPageIndexes = Array.from(
      { length: lastPageIndex - 1 },
      // +1 to account for the already fetched page and +1 to account for these
      // page indexes starting from 1 instead of 0
      (_, i) => i + 2,
    )

    const remainingPagesStream = Stream.fromIterable(remainingPageIndexes).pipe(
      Stream.mapEffect(
        flow(
          requestPageOfStarredRepos,
          Effect.tap(({ page }) =>
            Effect.log(
              `Racingly fetched ${addOrdinalSuffixTo(page)} page out of all ${lastPageIndex} pages`,
            ),
          ),
          Effect.either,
          Effect.map(distributeChunkSuccess),
        ),
        { concurrency: 'unbounded', unordered: true },
      ),
      Stream.flattenChunks,
    )

    return Stream.concat(firstPageStream, remainingPagesStream)
  }).pipe(Stream.unwrap)

const makeRequesterOfStarredReposPage = Effect.fnUntraced(function* (
  username: string,
  reposPerPage: number,
) {
  if (!username)
    return yield* Effect.dieMessage(
      'starredReposOfUser accepts only non-empty strings as username',
    )

  if (reposPerPage <= 0 || reposPerPage > 100)
    return yield* Effect.dieMessage(
      'starredReposOfUser accepts only 0 < reposPerPage <= 100',
    )

  const octokit = new Octokit()

  return Effect.fn('requestPageOfStarredRepos')(function* (pageIndex: number) {
    const { data, headers } = yield* Effect.tryPromise({
      try: () =>
        octokit.request('GET /users/{username}/starred', {
          username,
          per_page: reposPerPage,
          page: pageIndex,
          sort: 'updated',
          direction: 'desc', // newest updated go first
          headers: { 'X-GitHub-Api-Version': '2022-11-28' },
        }),
      catch: (error): OctokitError =>
        new OctokitError({ cause: error as RequestError }),
    })

    const linkHeader = yield* parseLinkHeader(headers.link)

    return {
      page: pageIndex,
      linkHeader,
      repos: Chunk.unsafeFromArray(
        data.map(e => {
          const repo = 'repo' in e ? e.repo : e
          return Repo.make({
            name: repo.name,
            owner: repo.owner.login,
            isItArchived: repo.archived,
            isTemplate: !!repo.is_template,
            starCount: repo.stargazers_count,
            forkCount: repo.forks_count,
            lastTimeBeenPushedInto: repo.pushed_at
              ? new Date(repo.pushed_at)
              : null,
          })
        }),
      ),
    }
  })
})
