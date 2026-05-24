import * as Schema from 'effect/Schema'

import { ArtistBasic, ThumbnailFull } from './common.ts'
import { SongDetailed } from './song.ts'

export const AlbumDetailed = Schema.Struct({
  type: Schema.Literal('ALBUM'),
  albumId: Schema.NonEmptyTrimmedString,
  playlistId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  year: Schema.NullOr(Schema.Int.pipe(Schema.between(1900, 2100))),
  thumbnails: Schema.Array(ThumbnailFull),
})
export type AlbumDetailed = Schema.Schema.Type<typeof AlbumDetailed>

export const AlbumFull = Schema.Struct({
  type: Schema.Literal('ALBUM'),
  albumId: Schema.NonEmptyTrimmedString,
  playlistId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  year: Schema.NullOr(Schema.Int.pipe(Schema.between(1900, 2100))),
  thumbnails: Schema.Array(ThumbnailFull),
  songs: Schema.Array(SongDetailed),
})
export type AlbumFull = Schema.Schema.Type<typeof AlbumFull>
