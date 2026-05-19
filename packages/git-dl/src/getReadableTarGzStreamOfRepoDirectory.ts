import { RequestError } from '@octokit/request-error'

import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'

import { CastToReadableStream } from './castToReadableStream.ts'
import {
  GitHubApiGeneralUserError,
  parseCommonGitHubApiErrors,
} from './commonErrors.ts'
import { InputConfigTag } from './configContext.ts'
import { OctokitTag } from './octokit.ts'

export const getReadableTarGzStreamOfRepoDirectory = (
  gitRefWhichWillBeUsedToIdentifyGitTree?: string,
) =>
  EFunction.pipe(
    requestTarballFromGitHubAPI(gitRefWhichWillBeUsedToIdentifyGitTree),
    Effect.map(({ data }) => data),
    CastToReadableStream,
  )

const requestTarballFromGitHubAPI = (
  gitRefWhichWillBeUsedToIdentifyGitTree = '',
) =>
  Effect.gen(function* () {
    const octokit = yield* OctokitTag

    const {
      repo: { owner, name },
    } = yield* InputConfigTag

    return yield* Effect.tryPromise({
      try: signal =>
        octokit.request('GET /repos/{owner}/{repo}/tarball/{ref}', {
          owner,
          repo: name,
          ref: gitRefWhichWillBeUsedToIdentifyGitTree,
          request: {
            signal,
            parseSuccessResponseBody: false,
          },
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }),
      catch: error => {
        if (!(error instanceof RequestError))
          return new Cause.UnknownException(
            error,
            'Failed to request .tar.gz file from GitHub API',
          )

        if (error.status === 400)
          return new GitHubApiGeneralUserError(error, {
            notes: 'Error happened probably because you asked for empty repo',
          })

        return parseCommonGitHubApiErrors(error)
      },
    })
  })
