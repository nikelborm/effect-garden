import * as Schema from 'effect/Schema'

import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const AlbumDetailed = Schema.Struct({
  type: Schema.Literal('ALBUM'),
  albumId: Schema.NonEmptyTrimmedString,
  playlistId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  year: Schema.NullOr(Schema.Int.pipe(Schema.between(1900, 2100))),
  thumbnails: Schema.Array(ThumbnailFull),
}).annotations({ title: 'AlbumDetailed' })

export type AlbumDetailed = Schema.Schema.Type<typeof AlbumDetailed>
