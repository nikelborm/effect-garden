import * as Schema from 'effect/Schema'

import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const UpNextsDetails = Schema.Struct({
  type: Schema.Literal('SONG'),
  videoId: Schema.Trimmed.check(Schema.isNonEmpty()),
  title: Schema.Trimmed.check(Schema.isNonEmpty()),
  artist: ArtistBasic,
  duration: Schema.NullOr(Schema.Int.check(Schema.isGreaterThanOrEqualTo(0))),
  thumbnails: Schema.Array(ThumbnailFull),
}).annotateKey({ title: 'UpNextsDetails' })

export type UpNextsDetails = Schema.Schema.Type<typeof UpNextsDetails>
