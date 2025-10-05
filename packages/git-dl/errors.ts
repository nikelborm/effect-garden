/**
 * @module
 */

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
} from './src/commonErrors.ts';
export * from './src/TaggedErrorVerifyingCause.ts';
export { FailedToCastDataToReadableStreamError } from './src/castToReadableStream.ts';
export {
  FailedToParseGitLFSInfoError,
  FailedToParseResponseFromRepoPathContentsMetaInfoAPIError,
  InconsistentExpectedAndRealContentSizeError,
} from './src/getPathContents/index.ts';
export { FailedToUnpackRepoFolderTarGzStreamToFsError } from './src/unpackRepoFolderTarGzStreamToFs.ts';
export { FailedToWriteFileStreamToDestinationPathError } from './src/writeFileStreamToDestinationPath.ts';
