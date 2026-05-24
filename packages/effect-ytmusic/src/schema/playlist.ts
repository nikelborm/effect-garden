import * as Schema from 'effect/Schema'

import { ArtistBasic, ThumbnailFull } from './common.ts'

export const PlaylistDetailed = Schema.Struct({
  type: Schema.Literal('PLAYLIST'),
  playlistId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  thumbnails: Schema.Array(ThumbnailFull),
})
export type PlaylistDetailed = Schema.Schema.Type<typeof PlaylistDetailed>

export const PlaylistFull = Schema.Struct({
  type: Schema.Literal('PLAYLIST'),
  playlistId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  videoCount: Schema.Int.pipe(Schema.nonNegative()),
  thumbnails: Schema.Array(ThumbnailFull),
})
export type PlaylistFull = Schema.Schema.Type<typeof PlaylistFull>
