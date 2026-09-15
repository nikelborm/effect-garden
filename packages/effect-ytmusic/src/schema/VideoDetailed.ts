import * as Schema from 'effect/Schema'

import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const VideoDetailed = Schema.Struct({
  type: Schema.Literal('VIDEO'),
  videoId: Schema.Trimmed.check(Schema.isNonEmpty()),
  name: Schema.Trimmed.check(Schema.isNonEmpty()),
  artist: ArtistBasic,
  duration: Schema.NullOr(Schema.Int.check(Schema.isGreaterThanOrEqualTo(0))),
  thumbnails: Schema.Array(ThumbnailFull),
}).annotateKey({ title: 'VideoDetailed' })

export type VideoDetailed = Schema.Schema.Type<typeof VideoDetailed>
