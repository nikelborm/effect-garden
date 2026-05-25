import * as Schema from 'effect/Schema'

import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const UpNextsDetails = Schema.Struct({
  type: Schema.Literal('SONG'),
  videoId: Schema.NonEmptyTrimmedString,
  title: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  duration: Schema.NullOr(Schema.Int.pipe(Schema.nonNegative())),
  thumbnails: Schema.Array(ThumbnailFull),
}).annotations({ title: 'UpNextsDetails' })

export type UpNextsDetails = Schema.Schema.Type<typeof UpNextsDetails>
