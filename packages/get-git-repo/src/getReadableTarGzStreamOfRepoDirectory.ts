import { RequestError } from '@octokit/request-error';
import { UnknownException } from 'effect/Cause';
import { gen, map, tryPromise } from 'effect/Effect';
import { pipe } from 'effect/Function';
import { CastToReadableStream } from './castToReadableStream.ts';
import {
  GitHubApiGeneralUserError,
  parseCommonGitHubApiErrors,
} from './commonErrors.ts';
import { InputConfigTag } from './configContext.ts';
import { OctokitTag } from './octokit.ts';

export const getReadableTarGzStreamOfRepoDirectory = (
  gitRefWhichWillBeUsedToIdentifyGitTree?: string,
) =>
  pipe(
    requestTarballFromGitHubAPI(gitRefWhichWillBeUsedToIdentifyGitTree),
    map(({ data }) => data),
    CastToReadableStream,
  );

const requestTarballFromGitHubAPI = (
  gitRefWhichWillBeUsedToIdentifyGitTree = '',
) =>
  gen(function* () {
    const octokit = yield* OctokitTag;

    const {
      repo: { owner, name },
    } = yield* InputConfigTag;

    return yield* tryPromise({
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
          return new UnknownException(
            error,
            'Failed to request .tar.gz file from GitHub API',
          );

        if (error.status === 400)
          return new GitHubApiGeneralUserError(error, {
            notes: 'Error happened probably because you asked for empty repo',
          });

        return parseCommonGitHubApiErrors(error);
      },
    });
  });
