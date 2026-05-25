import * as Schema from 'effect/Schema'

import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const VideoDetailed = Schema.Struct({
  type: Schema.Literal('VIDEO'),
  videoId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  duration: Schema.NullOr(Schema.Int.pipe(Schema.nonNegative())),
  thumbnails: Schema.Array(ThumbnailFull),
}).annotations({ title: 'VideoDetailed' })

export type VideoDetailed = Schema.Schema.Type<typeof VideoDetailed>
