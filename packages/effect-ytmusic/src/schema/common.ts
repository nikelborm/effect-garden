import * as Schema from 'effect/Schema'

export const ThumbnailFull = Schema.Struct({
  url: Schema.NonEmptyTrimmedString,
  width: Schema.Int.pipe(Schema.positive()),
  height: Schema.Int.pipe(Schema.positive()),
})
export type ThumbnailFull = Schema.Schema.Type<typeof ThumbnailFull>

export const ArtistBasic = Schema.Struct({
  artistId: Schema.NullOr(Schema.NonEmptyTrimmedString),
  name: Schema.NonEmptyTrimmedString,
})
export type ArtistBasic = Schema.Schema.Type<typeof ArtistBasic>

export const AlbumBasic = Schema.Struct({
  albumId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
})
export type AlbumBasic = Schema.Schema.Type<typeof AlbumBasic>
