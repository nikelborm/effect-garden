import type { Octokit } from '@octokit/core'
import type { UnknownException } from 'effect/Cause'
import { type Effect, fail, gen } from 'effect/Effect'
import type { FailedToCastDataToReadableStreamError } from './castToReadableStream.ts'
import type {
  GitHubApiAuthRatelimitedError,
  GitHubApiBadCredentialsError,
  GitHubApiGeneralServerError,
  GitHubApiGeneralUserError,
  GitHubApiNoCommitFoundForGitRefError,
  GitHubApiRatelimitedError,
  GitHubApiRepoIsEmptyError,
  GitHubApiThingNotExistsOrYouDontHaveAccessError,
} from './commonErrors.ts'
import {
  provideSingleDownloadTargetConfig,
  type SingleTargetConfig,
} from './configContext.ts'
import {
  type FailedToParseResponseFromRepoPathContentsMetaInfoAPIError,
  type InconsistentExpectedAndRealContentSizeError,
  PathContentsMetaInfo,
  RawStreamOfRepoPathContentsFromGitHubAPI,
} from './getPathContents/index.ts'
import { getReadableTarGzStreamOfRepoDirectory } from './getReadableTarGzStreamOfRepoDirectory.ts'
import {
  type FailedToUnpackRepoFolderTarGzStreamToFsError,
  unpackRepoFolderTarGzStreamToFs,
} from './unpackRepoFolderTarGzStreamToFs.ts'
import {
  type FailedToWriteFileStreamToDestinationPathError,
  writeFileStreamToDestinationPath,
} from './writeFileStreamToDestinationPath.ts'

const downloadEntityFromRepoWithoutContext = gen(function* () {
  const pathContentsMetaInfo = yield* PathContentsMetaInfo

  if (pathContentsMetaInfo.type === 'dir')
    return yield* unpackRepoFolderTarGzStreamToFs(
      getReadableTarGzStreamOfRepoDirectory(pathContentsMetaInfo.treeSha),
    )

  if (
    pathContentsMetaInfo.meta ===
    'This file is small enough that GitHub API decided to inline it'
  )
    return yield* writeFileStreamToDestinationPath(
      pathContentsMetaInfo.contentStream,
    )

  if (pathContentsMetaInfo.meta === 'This file can be downloaded as a blob')
    return yield* writeFileStreamToDestinationPath(
      RawStreamOfRepoPathContentsFromGitHubAPI,
    )

  yield* fail(new Error('LFS files are not yet supported'))
})

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export const downloadEntityFromRepo = (
  target: SingleTargetConfig,
): Effect<
  void,
  | Error
  | InconsistentExpectedAndRealContentSizeError
  | FailedToWriteFileStreamToDestinationPathError
  | FailedToUnpackRepoFolderTarGzStreamToFsError
  | UnknownException
  | GitHubApiRepoIsEmptyError
  | GitHubApiNoCommitFoundForGitRefError
  | GitHubApiThingNotExistsOrYouDontHaveAccessError
  | GitHubApiBadCredentialsError
  | GitHubApiAuthRatelimitedError
  | GitHubApiRatelimitedError
  | GitHubApiGeneralServerError
  | GitHubApiGeneralUserError
  | FailedToParseResponseFromRepoPathContentsMetaInfoAPIError
  | FailedToCastDataToReadableStreamError,
  Octokit
> =>
  downloadEntityFromRepoWithoutContext.pipe(
    provideSingleDownloadTargetConfig(target),
  )
