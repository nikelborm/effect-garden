// https://github.com/jpb06/effect-octokit-layer/blob/fa400ef5cc9579b5f27a901d2f84d36d2aac73dd/LICENSE
// MIT License
//
// Copyright (c) 2025 jpb06
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { Octokit } from '@octokit/core'
import type { Endpoints } from '@octokit/types'
import type { RequestParameters } from '@octokit/types/dist-types/RequestParameters.js'
import { differenceInSeconds, fromUnixTime } from 'date-fns'
import pico from 'picocolors'

import * as Config from 'effect/Config'
import * as Console from 'effect/Console'
import { TaggedError } from 'effect/Data'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Result from 'effect/Result'
import * as Schedule from 'effect/Schedule'
import * as Schema from 'effect/Schema'

export const getRepoIssues = (args: GetRepoIssuesAggregatorArgs) =>
  pipe(
    getAllPages(
      (args, page) =>
        getOnePage('get-repo-issues-page', 'GET /repos/{owner}/{repo}/issues', {
          ...args,
          page,
          per_page: 100,
        }),
      args,
    ),
    Effect.map(results =>
      args.excludePulls === true
        ? results.filter(({ pull_request }) => pull_request === undefined)
        : results,
    ),
    Effect.withSpan('get-repo-issues', {
      attributes: { ...args },
    }),
  )

export const getIssueComments = (args: GetIssueCommentsArgs) =>
  pipe(
    getAllPages(
      ({ issueNumber, ...args }, page) =>
        getOnePage(
          'get-issue-comments-page',
          'GET /repos/{owner}/{repo}/issues/{issue_number}/comments',
          {
            ...args,
            issue_number: issueNumber,
            per_page: 100,
            page,
          },
        ),
      args,
    ),
    Effect.withSpan('get-issue-comments', { attributes: { ...args } }),
  )

interface GetIssueCommentsArgs extends RepoArgs {
  issueNumber: number
  concurrency?: number
}

const unsetTokenValue = 'github-token-not-set'

const githubConfig = Config.withDefault(
  Config.String('GITHUB_TOKEN'),
  unsetTokenValue,
)

const githubSourceAnalysisProvider = Effect.gen(function* () {
  const token = yield* githubConfig
  if (token === unsetTokenValue) {
    return yield* Effect.fail(
      new GithubApiError({ message: 'GITHUB_TOKEN not set' }),
    )
  }

  return yield* Effect.try({
    try: () => new Octokit({ auth: token }),
    catch: e => new GithubApiError({ cause: e }),
  })
})

const retryWarningMessage = (
  requestUrl: string,
  retryAfterInSeconds: string | number,
) =>
  `${pico.yellowBright('⚠️  Rate limit error on')} '${pico.underline(requestUrl)}'\n⏳ ${pico.greenBright(`retrying in ${+retryAfterInSeconds + 5} seconds.`)}`

const rateLimitExceededWarningMessage = (resource: string, value: string) =>
  pico.gray(
    `💥 Rate limit value of '${value}' exceeded for resource '${resource}'.`,
  )

const rateLimitErrorMessage = (requestUrl: string) =>
  pico.yellowBright(`🚨 Rate limit error on '${requestUrl}'.`)

const warnOnRetryAndFailWithApiRateLimitError = Effect.fn(function* ({
  requestUrl,
  retryAfterInSeconds,
  rateLimitReset,
  rateLimit,
  rateLimitUsed,
  rateLimiteResource,
}: RetryAfterTag) {
  if (retryAfterInSeconds !== undefined) {
    yield* Console.warn(retryWarningMessage(requestUrl, retryAfterInSeconds))

    return yield* new ApiRateLimitError({
      retryAfterInSeconds,
    })
  }
  if (rateLimitReset !== undefined) {
    const retryAfterInSeconds = differenceInSeconds(
      fromUnixTime(+rateLimitReset),
      new Date(),
    )

    if (
      rateLimit !== undefined &&
      rateLimit === rateLimitUsed &&
      rateLimiteResource !== undefined
    ) {
      yield* Console.warn(
        rateLimitExceededWarningMessage(rateLimiteResource, rateLimit),
      )
    }
    yield* Console.warn(retryWarningMessage(requestUrl, retryAfterInSeconds))

    return yield* new ApiRateLimitError({
      retryAfterInSeconds,
    })
  }

  yield* Console.error(rateLimitErrorMessage(requestUrl))
  return yield* new GithubApiError({
    message: 'Rate limit error',
  })
})

class ApiRateLimitError extends TaggedError('ApiRateLimitError')<{
  retryAfterInSeconds: string | number
}> {}

class GithubApiError extends TaggedError('GithubApiError')<{
  cause?: unknown
  message?: string
}> {}

type RetryAfterTag = {
  _tag: 'retry-after'
  retryAfterInSeconds: string | number | undefined
  rateLimitReset: string | undefined
  rateLimiteResource: string | undefined
  rateLimit: string | undefined
  rateLimitUsed: string | undefined
  requestUrl: string
}

const OctokitApiRateLimitErrorSchema = Schema.Struct({
  name: Schema.String,
  status: Schema.Number,
  request: Schema.Struct({
    url: pipe(
      Schema.String.check(Schema.isPattern(/^https:\/\/api\.github\.com\//)),
    ),
  }),
  response: Schema.Struct({
    data: pipe(
      Schema.Struct({
        message: pipe(Schema.String, Schema.optional),
      }),
      Schema.optional,
    ),
    headers: Schema.Struct({
      'retry-after': pipe(
        Schema.String.check(
          Schema.isNonEmpty(),
          Schema.isPattern(/^[1-9]\d*$/),
        ),
        Schema.optional,
      ),
      'x-ratelimit-reset': pipe(Schema.String, Schema.optional),
      'x-ratelimit-resource': pipe(Schema.String, Schema.optional),
      'x-ratelimit-limit': pipe(Schema.String, Schema.optional),
      'x-ratelimit-used': pipe(Schema.String, Schema.optional),
      'x-ratelimit-remaining': pipe(Schema.String, Schema.optional),
    }),
  }),
})

const handleOctokitRequestError = (
  requestError: unknown,
): RetryAfterTag | GithubApiError =>
  pipe(
    requestError,
    Schema.decodeUnknownResult(Schema.toType(OctokitApiRateLimitErrorSchema)),
    Result.match({
      onSuccess: ({ name, status, request, response }) => {
        const isRateLimitError =
          (status === 403 || status === 429) &&
          response.headers['x-ratelimit-remaining'] === '0'
        if (isRateLimitError) {
          return {
            _tag: 'retry-after' as const,
            retryAfterInSeconds: response.headers['retry-after'],
            rateLimiteResource: response.headers['x-ratelimit-resource'],
            rateLimitReset: response.headers['x-ratelimit-reset'],
            rateLimit: response.headers['x-ratelimit-limit'],
            rateLimitUsed: response.headers['x-ratelimit-used'],
            requestUrl: request.url.replace('https://api.github.com', ''),
          }
        }

        return new GithubApiError({
          message: `${name} ${status} - ${response.data?.message ?? 'Unknown error'}`,
        })
      },
      onFailure: () => {
        if (requestError instanceof Error)
          return new GithubApiError({ cause: requestError.message })

        return new GithubApiError({ cause: requestError })
      },
    }),
  )

const isApiRateLimitError = (e: unknown): e is ApiRateLimitError =>
  typeof e === 'object' &&
  e !== null &&
  '_tag' in e &&
  e._tag === 'ApiRateLimitError'

// Retry once on `ApiRateLimitError`, waiting for `retryAfterInSeconds + 5`
// before each retry decision.
// `Schedule.forever` outputs `attempt - 1`, so `meta.output < 1` is the
// at-most-once attempt guard, and the effectful branch performs the delay
// only when the input is a rate-limit error.
const retryAfterSchedule = pipe(
  Schedule.forever,
  Schedule.while(meta =>
    meta.output >= 1 || !isApiRateLimitError(meta.input)
      ? Effect.succeed(false)
      : Effect.delay(Duration.seconds(+meta.input.retryAfterInSeconds + 5))(
          Effect.succeed(true),
        ),
  ),
)

interface ResponseWithLinkHeaders {
  headers: {
    link?: string
  }
}

type LinkKey = 'prev' | 'next' | 'last'

type Link = {
  prev?: number
  next?: number
  last?: number
}

const parseLink = (response: ResponseWithLinkHeaders) =>
  response.headers.link?.split(', ').reduce<Link>((result, link) => {
    const [url, type] = link.split('; ')
    const params = new URLSearchParams(url?.slice(1, -1).split('?')[1])

    const page = params.get('page')

    result[type?.match(/^rel="(.*)"$/)?.[1] as LinkKey] = page
      ? +page
      : (undefined as never)
    return result
  }, {})

const arrayRange = (start: number, stop: number, step = 1) =>
  Array.from(
    { length: (stop - start) / step + 1 },
    (_, index) => start + index * step,
  )

const octokitRequest =
  ({ request }: Octokit) =>
  <TRoute extends keyof Endpoints>(
    route: TRoute,
    options?: Endpoints[TRoute]['parameters'] & RequestParameters,
  ): Promise<Endpoints[TRoute]['response']> =>
    request<TRoute>(route, options as never) as Promise<
      Endpoints[TRoute]['response']
    >

const getOnePage = <E extends keyof Endpoints>(
  span: string,
  route: E,
  options?: Endpoints[E]['parameters'] & RequestParameters,
) =>
  pipe(
    githubSourceAnalysisProvider,
    Effect.flatMap(octokit =>
      pipe(
        Effect.tryPromise({
          try: () => octokitRequest(octokit)<E>(route, options),
          catch: handleOctokitRequestError,
        }),
        Effect.catchTag('retry-after', warnOnRetryAndFailWithApiRateLimitError),
        Effect.retry(retryAfterSchedule),
      ),
    ),
    Effect.map(response => ({
      data: response.data as Endpoints[E]['response']['data'],
      links: parseLink(response),
    })),
    Effect.withSpan(span, {
      attributes: { ...options },
    }),
  )

interface DataWithLinks<TData> {
  links: Link | undefined
  data: TData
}

const defaultConcurrency = 10

type GetPage<TArgs, TData, TError> = (
  args: TArgs,
  page: number,
) => Effect.Effect<DataWithLinks<TData>, TError, never>

const getAllPages = Effect.fn('get-all-pages')(function* <
  TError,
  TArgs extends { concurrency?: number } & Record<string, any>,
  TDataItem,
  TData extends TDataItem[],
>(getPage: GetPage<TArgs, TData, TError>, args: TArgs) {
  yield* Effect.annotateCurrentSpan(args)

  const firstPage = yield* getPage(args, 1)
  if (firstPage.links?.last === undefined) {
    return firstPage.data
  }

  const pagesResults = yield* Effect.all(
    arrayRange(2, firstPage.links.last).map(page => getPage(args, page)),
    {
      concurrency: args.concurrency ?? defaultConcurrency,
    },
  )

  return [...firstPage.data, ...pagesResults.flatMap(r => r.data)] as TData
})

type GetRepoIssuesSorting = 'updated' | 'created' | 'comments'
type SortDirection = 'asc' | 'desc'
type IssueState = 'all' | 'open' | 'closed'

type GetRepoIssuesArgs = {
  state: IssueState
  assignee?: string
  creator?: string
  mentioned?: string
  since?: string
  sort?: GetRepoIssuesSorting
  direction?: SortDirection
  excludePulls?: boolean
}

export interface RepoArgs {
  owner: string
  repo: string
}

interface GetRepoIssuesAggregatorArgs extends RepoArgs, GetRepoIssuesArgs {
  concurrency?: number
}
