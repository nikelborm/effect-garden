import * as Schema from 'effect/Schema'

import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const SongFull = Schema.Struct({
  type: Schema.Literal('SONG'),
  videoId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  duration: Schema.Int.pipe(Schema.nonNegative()),
  thumbnails: Schema.Array(ThumbnailFull),
  formats: Schema.Array(Schema.Unknown),
  adaptiveFormats: Schema.Array(Schema.Unknown),
}).annotations({ title: 'SongFull' })

export type SongFull = Schema.Schema.Type<typeof SongFull>
