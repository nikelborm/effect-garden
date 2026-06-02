import { Octokit } from '@octokit/core'
import { outdent } from 'outdent'

import { addOrdinalSuffixTo } from './addOrdinalSuffixToNumber.ts'
import { parseLinkHeader } from './parseLinkHeader.ts'
import { racinglyIterateAll } from './racinglyIterateAll.ts'
import type { IRepo } from './repo.interface.ts'

export async function* starredReposOfUser(username: string, per_page: number) {
  console.log(`Started fetching pages of ${username}'s starred repos`)

  const { linkHeader, repos } = await requestPageOfStarredRepos({
    page: 1,
    per_page,
    username,
  })

  yield* repos

  const lastPage = linkHeader.last?.page || linkHeader.next?.page

  console.log(
    `Fetched the first ` +
      (lastPage
        ? `out of ${lastPage} pages`
        : `page, which is also the only one here`),
  )

  if (!lastPage) return

  const promisesToGetRestOfThePages = Array.from(
    { length: lastPage - 1 },
    (_, index) =>
      requestPageOfStarredRepos({
        page: index + 2,
        per_page,
        username,
      }),
  )

  for await (const {
    result: { repos, page },
  } of racinglyIterateAll(promisesToGetRestOfThePages, true)) {
    console.log(outdent({ newline: '' })`
      Racingly fetched ${addOrdinalSuffixTo(page)}
      page out of all ${lastPage} pages
    `)

    yield* repos
  }
}

async function requestPageOfStarredRepos({
  page,
  username,
  per_page,
}: {
  page: number
  username: string
  per_page: number
}) {
  if (per_page <= 0 || per_page > 100)
    throw new Error(
      'requestPageOfStarredRepos accepts only 0 < per_page <= 100',
    )

  if (!username)
    throw new Error(
      'requestPageOfStarredRepos accepts only non-empty strings as username',
    )

  // TODO: detach client
  const octokit = new Octokit()

  const { data, headers } = await octokit.request(
    'GET /users/{username}/starred',
    {
      username,
      per_page,
      page,
      sort: 'updated',
      direction: 'desc', // newest updated go first
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )

  return {
    page,
    linkHeader: parseLinkHeader(headers.link),
    repos: data.map(e => {
      const repo = 'repo' in e ? e.repo : e
      return {
        name: repo.name,
        owner: repo.owner.login,
        isItArchived: repo.archived,
        isTemplate: !!repo.is_template,
        starCount: repo.stargazers_count,
        forkCount: repo.forks_count,
        lastTimeBeenPushedInto: repo.pushed_at
          ? new Date(repo.pushed_at)
          : null,
      } satisfies IRepo
    }),
  }
}
