import * as HttpClientError from '@effect/platform/HttpClientError'
import * as ParseResult from 'effect/ParseResult'
import * as Schema from 'effect/Schema'

export class NetworkError extends Schema.TaggedError<NetworkError>()(
  'NetworkError',
  {
    message: Schema.NonEmptyTrimmedString,
    cause: Schema.Union(
      Schema.instanceOf(HttpClientError.RequestError),
      Schema.instanceOf(HttpClientError.ResponseError),
    ),
  },
) {}

export class HttpStatusError extends Schema.TaggedError<HttpStatusError>()(
  'HttpStatusError',
  {
    status: Schema.Int.pipe(Schema.between(100, 599)),
    endpoint: Schema.NonEmptyTrimmedString,
    cause: Schema.instanceOf(HttpClientError.ResponseError),
  },
) {}

export class ConfigExtractionError extends Schema.TaggedError<ConfigExtractionError>()(
  'ConfigExtractionError',
  {
    message: Schema.NonEmptyTrimmedString,
    cause: Schema.optional(Schema.Defect),
  },
) {}

export class ParseError extends Schema.TaggedError<ParseError>()('ParseError', {
  schema: Schema.NonEmptyTrimmedString,
  data: Schema.Unknown,
  cause: Schema.instanceOf(ParseResult.ParseError),
}) {}

export class InvalidVideoIdError extends Schema.TaggedError<InvalidVideoIdError>()(
  'InvalidVideoIdError',
  { videoId: Schema.String },
) {}

export class InvalidArtistIdError extends Schema.TaggedError<InvalidArtistIdError>()(
  'InvalidArtistIdError',
  { artistId: Schema.String },
) {}

export class InvalidAlbumIdError extends Schema.TaggedError<InvalidAlbumIdError>()(
  'InvalidAlbumIdError',
  { albumId: Schema.String },
) {}

export class InvalidPlaylistIdError extends Schema.TaggedError<InvalidPlaylistIdError>()(
  'InvalidPlaylistIdError',
  { playlistId: Schema.String },
) {}

export class TraverseNotFoundError extends Schema.TaggedError<TraverseNotFoundError>()(
  'TraverseNotFoundError',
  { keys: Schema.Array(Schema.NonEmptyTrimmedString) },
) {}

export class LyricsNotFoundError extends Schema.TaggedError<LyricsNotFoundError>()(
  'LyricsNotFoundError',
  {},
) {}

export class MissingBrowseTokenError extends Schema.TaggedError<MissingBrowseTokenError>()(
  'MissingBrowseTokenError',
  { context: Schema.NonEmptyTrimmedString },
) {}

export class VideoIdMismatchError extends Schema.TaggedError<VideoIdMismatchError>()(
  'VideoIdMismatchError',
  { requested: Schema.String, received: Schema.String },
) {}

export class InvalidResponseShapeError extends Schema.TaggedError<InvalidResponseShapeError>()(
  'InvalidResponseShapeError',
  { endpoint: Schema.NonEmptyTrimmedString },
) {}

export class EmptyContinuationError extends Schema.TaggedError<EmptyContinuationError>()(
  'EmptyContinuationError',
  {},
) {}
