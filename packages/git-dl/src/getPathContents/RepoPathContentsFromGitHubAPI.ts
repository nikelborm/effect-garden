import { RequestError } from '@octokit/request-error'
import type { OctokitResponse } from '@octokit/types'

import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'

import {
  GitHubApiNoCommitFoundForGitRefError,
  GitHubApiRepoIsEmptyError,
  GitHubApiThingNotExistsOrYouDontHaveAccessError,
  parseCommonGitHubApiErrors,
} from '../commonErrors.ts'
import { InputConfigTag } from '../configContext.ts'
import { OctokitTag } from '../octokit.ts'

export const RepoPathContentsFromGitHubAPI = Effect.fn(
  'getRepoPathContentsFromGitHubAPI',
)(function* (format: 'object' | 'raw', streamBody?: boolean) {
  const octokit = yield* OctokitTag

  const { gitRef, pathToEntityInRepo, repo } = yield* InputConfigTag

  return yield* Effect.tryPromise({
    try: signal =>
      octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: repo.owner,
        repo: repo.name,
        path: pathToEntityInRepo,
        ...(gitRef && { ref: gitRef }),
        request: {
          signal,
          parseSuccessResponseBody: !streamBody,
        },
        mediaType: { format },
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }),
    catch: error => {
      if (!(error instanceof RequestError))
        return new Cause.UnknownException(
          error,
          'Failed to request contents at the path inside GitHub repo',
        )

      const potentialErrorMessage = (error.response as ResponseWithError)?.data
        ?.message

      if (error.status === 404 && potentialErrorMessage)
        return parseNotFoundErrors(potentialErrorMessage, error, gitRef)

      return parseCommonGitHubApiErrors(error)
    },
  })
})

const parseNotFoundErrors = (
  potentialErrorMessage: string,
  error: RequestError,
  gitRef: string,
) => {
  if (potentialErrorMessage === 'This repository is empty.')
    return new GitHubApiRepoIsEmptyError(error)

  if (gitRef && potentialErrorMessage.startsWith('No commit found for the ref'))
    return new GitHubApiNoCommitFoundForGitRefError(error, { gitRef })

  return new GitHubApiThingNotExistsOrYouDontHaveAccessError(error)
}

type ResponseWithError = OctokitResponse<
  { message?: string } | undefined,
  number
>
