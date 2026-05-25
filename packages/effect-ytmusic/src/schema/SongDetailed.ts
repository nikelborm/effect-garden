import * as Schema from 'effect/Schema'

import { AlbumBasic } from './AlbumBasic.ts'
import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const SongDetailed = Schema.Struct({
  type: Schema.Literal('SONG'),
  videoId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  album: Schema.NullOr(AlbumBasic),
  duration: Schema.NullOr(Schema.Int.pipe(Schema.nonNegative())),
  thumbnails: Schema.Array(ThumbnailFull),
}).annotations({ title: 'SongDetailed' })

export type SongDetailed = Schema.Schema.Type<typeof SongDetailed>
