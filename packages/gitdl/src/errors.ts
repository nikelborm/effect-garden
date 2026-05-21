/**
 * @module
 */

export { FailedToCastDataToReadableStreamError } from './castToReadableStream.ts'
export {
  GitHubApiAuthRatelimitedError,
  GitHubApiBadCredentialsError,
  type GitHubApiCommonErrors,
  GitHubApiGeneralServerError,
  GitHubApiGeneralUserError,
  GitHubApiNoCommitFoundForGitRefError,
  GitHubApiRatelimitedError,
  GitHubApiRepoIsEmptyError,
  GitHubApiThingNotExistsOrYouDontHaveAccessError,
} from './commonErrors.ts'
export {
  FailedToParseGitLFSInfoError,
  FailedToParseResponseFromRepoPathContentsMetaInfoAPIError,
  InconsistentExpectedAndRealContentSizeError,
} from './getPathContents/index.ts'
export * from './TaggedErrorVerifyingCause.ts'
export { FailedToUnpackRepoFolderTarGzStreamToFsError } from './unpackRepoFolderTarGzStreamToFs.ts'
export { FailedToWriteFileStreamToDestinationPathError } from './writeFileStreamToDestinationPath.ts'
