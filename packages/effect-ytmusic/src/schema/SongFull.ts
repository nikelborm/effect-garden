import * as Schema from 'effect/Schema'

import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const SongFull = Schema.Struct({
  type: Schema.Literal('SONG'),
  videoId: Schema.Trimmed.check(Schema.isNonEmpty()),
  name: Schema.Trimmed.check(Schema.isNonEmpty()),
  artist: ArtistBasic,
  duration: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  thumbnails: Schema.Array(ThumbnailFull),
  formats: Schema.Array(Schema.Unknown),
  adaptiveFormats: Schema.Array(Schema.Unknown),
}).annotateKey({ title: 'SongFull' })

export type SongFull = Schema.Schema.Type<typeof SongFull>
