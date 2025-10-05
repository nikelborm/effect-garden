import { CastToReadableStream } from '../castToReadableStream.ts';
import { RepoPathContentsFromGitHubAPI } from './RepoPathContentsFromGitHubAPI.ts';

export const RawStreamOfRepoPathContentsFromGitHubAPI = CastToReadableStream(
  RepoPathContentsFromGitHubAPI('raw', true),
);
