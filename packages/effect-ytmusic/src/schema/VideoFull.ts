import * as Schema from 'effect/Schema'

import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const VideoFull = Schema.Struct({
  type: Schema.Literal('VIDEO'),
  videoId: Schema.Trimmed.check(Schema.isNonEmpty()),
  name: Schema.Trimmed.check(Schema.isNonEmpty()),
  artist: ArtistBasic,
  duration: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  thumbnails: Schema.Array(ThumbnailFull),
  unlisted: Schema.Boolean,
  familySafe: Schema.Boolean,
  paid: Schema.Boolean,
  tags: Schema.Array(Schema.String),
}).annotateKey({ title: 'VideoFull' })

export type VideoFull = Schema.Schema.Type<typeof VideoFull>
