import * as Schema from 'effect/Schema'

import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

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
}).annotations({ title: 'VideoFull' })

export type VideoFull = Schema.Schema.Type<typeof VideoFull>
