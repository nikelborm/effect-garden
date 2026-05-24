import * as Schema from 'effect/Schema'

import { ArtistBasic, ThumbnailFull } from './common.ts'

export const VideoDetailed = Schema.Struct({
  type: Schema.Literal('VIDEO'),
  videoId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  duration: Schema.NullOr(Schema.Int.pipe(Schema.nonNegative())),
  thumbnails: Schema.Array(ThumbnailFull),
})
export type VideoDetailed = Schema.Schema.Type<typeof VideoDetailed>

export const VideoFull = Schema.Struct({
  type: Schema.Literal('VIDEO'),
  videoId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  duration: Schema.Int.pipe(Schema.nonNegative()),
  thumbnails: Schema.Array(ThumbnailFull),
  unlisted: Schema.Boolean,
  familySafe: Schema.Boolean,
  paid: Schema.Boolean,
  tags: Schema.Array(Schema.String),
})
export type VideoFull = Schema.Schema.Type<typeof VideoFull>
