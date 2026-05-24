import * as Schema from 'effect/Schema'

import { AlbumBasic, ArtistBasic, ThumbnailFull } from './common.ts'

export const SongDetailed = Schema.Struct({
  type: Schema.Literal('SONG'),
  videoId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  album: Schema.NullOr(AlbumBasic),
  duration: Schema.NullOr(Schema.Int.pipe(Schema.nonNegative())),
  thumbnails: Schema.Array(ThumbnailFull),
})
export type SongDetailed = Schema.Schema.Type<typeof SongDetailed>

export const SongFull = Schema.Struct({
  type: Schema.Literal('SONG'),
  videoId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  duration: Schema.Int.pipe(Schema.nonNegative()),
  thumbnails: Schema.Array(ThumbnailFull),
  formats: Schema.Array(Schema.Unknown),
  adaptiveFormats: Schema.Array(Schema.Unknown),
})
export type SongFull = Schema.Schema.Type<typeof SongFull>
