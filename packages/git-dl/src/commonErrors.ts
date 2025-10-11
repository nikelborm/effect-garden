import { RequestError } from '@octokit/request-error'
import {
  buildTaggedErrorClassVerifyingCause,
  type TaggedErrorClass,
} from './TaggedErrorVerifyingCause.ts'

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export const _1: TaggedErrorClass<{
  ErrorName: 'GitHubApiGeneralServerError'
  ExpectedCauseClass: typeof RequestError
}> = buildTaggedErrorClassVerifyingCause()(
  'GitHubApiGeneralServerError',
  'GitHub API Error: Bad server',
  RequestError,
)

export class GitHubApiGeneralServerError extends _1 {}

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export const _2: TaggedErrorClass<{
  ErrorName: 'GitHubApiGeneralUserError'
  ExpectedCauseClass: typeof RequestError
  DynamicContext: { readonly notes?: string }
}> = buildTaggedErrorClassVerifyingCause<{ readonly notes?: string }>()(
  'GitHubApiGeneralUserError',
  'GitHub API Error: Bad user, invalid request',
  RequestError,
)

export class GitHubApiGeneralUserError extends _2 {}

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
const _3: TaggedErrorClass<{
  ErrorName: 'GitHubApiThingNotExistsOrYouDontHaveAccessError'
  ExpectedCauseClass: typeof RequestError
}> = buildTaggedErrorClassVerifyingCause()(
  'GitHubApiThingNotExistsOrYouDontHaveAccessError',
  "GitHub API Error: Either repo, owner, path in repo, or specified ref don't exist or you don't have permissions to access it",
  RequestError,
)

export class GitHubApiThingNotExistsOrYouDontHaveAccessError extends _3 {}

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export const _4: TaggedErrorClass<{
  ErrorName: 'GitHubApiRepoIsEmptyError'
  ExpectedCauseClass: typeof RequestError
}> = buildTaggedErrorClassVerifyingCause()(
  'GitHubApiRepoIsEmptyError',
  'GitHub API Error: This Repo is empty',
  RequestError,
)

export class GitHubApiRepoIsEmptyError extends _4 {}

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export const _5: TaggedErrorClass<{
  ErrorName: 'GitHubApiNoCommitFoundForGitRefError'
  ExpectedCauseClass: typeof RequestError
  DynamicContext: { gitRef: string }
}> = buildTaggedErrorClassVerifyingCause<{ gitRef: string }>()(
  'GitHubApiNoCommitFoundForGitRefError',
  'GitHub API Error: No commit found for this git ref',
  RequestError,
)

export class GitHubApiNoCommitFoundForGitRefError extends _5 {}

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export const _6: TaggedErrorClass<{
  ErrorName: 'GitHubApiBadCredentialsError'
  ExpectedCauseClass: typeof RequestError
}> = buildTaggedErrorClassVerifyingCause()(
  'GitHubApiBadCredentialsError',
  "GitHub API Error: Token you're using is invalid.",
  RequestError,
)

export class GitHubApiBadCredentialsError extends _6 {}

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export const _7: TaggedErrorClass<{
  ErrorName: 'GitHubApiAuthRatelimitedError'
  ExpectedCauseClass: typeof RequestError
}> = buildTaggedErrorClassVerifyingCause()(
  'GitHubApiAuthRatelimitedError',
  'GitHub API Error: Too many invalid auth attempts. Chillout pal',
  RequestError,
)

export class GitHubApiAuthRatelimitedError extends _7 {}

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export const _8: TaggedErrorClass<{
  ErrorName: 'GitHubApiRatelimitedError'
  ExpectedCauseClass: typeof RequestError
}> = buildTaggedErrorClassVerifyingCause()(
  'GitHubApiRatelimitedError',
  'GitHub API Error: Too many requests. Chillout pal',
  RequestError,
)

export class GitHubApiRatelimitedError extends _8 {}

export const parseCommonGitHubApiErrors = (error: RequestError) => {
  if (error.status === 401) return new GitHubApiBadCredentialsError(error)

  // https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api?apiVersion=2022-11-28#failed-login-limit
  if (error.status === 403) return new GitHubApiAuthRatelimitedError(error)

  // docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28
  if (error.status === 429) return new GitHubApiRatelimitedError(error)

  if (error.status === 404)
    return new GitHubApiThingNotExistsOrYouDontHaveAccessError(error)

  if (error.status >= 500) return new GitHubApiGeneralServerError(error)

  if (error.status >= 400) return new GitHubApiGeneralUserError(error, {})

  return error
}

export type GitHubApiCommonErrors =
  | RequestError
  | GitHubApiGeneralServerError
  | GitHubApiGeneralUserError
  | GitHubApiBadCredentialsError
  | GitHubApiAuthRatelimitedError
  | GitHubApiRatelimitedError
