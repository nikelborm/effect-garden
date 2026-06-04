import type { RequestError } from '@octokit/request-error'

import * as Data from 'effect/Data'

export class ParseLinkHeaderError extends Data.TaggedError(
  'ParseLinkHeaderError',
)<{
  readonly linkHeader: string | null | undefined
  readonly cause: unknown
}> {}

export class OctokitError extends Data.TaggedError('OctokitError')<{
  readonly cause: RequestError
}> {}

// TODO: add message Failed to fetch repo pin image for
export class FetchPinImageError extends Data.TaggedError('FetchPinImageError')<{
  readonly url: string
  readonly statusCode: number
}> {}
