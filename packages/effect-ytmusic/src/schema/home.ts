import * as Schema from 'effect/Schema'

import { AlbumDetailed } from './album.ts'
import { ArtistDetailed } from './artist.ts'
import { ArtistBasic, ThumbnailFull } from './common.ts'
import { PlaylistDetailed } from './playlist.ts'
import { SongDetailed } from './song.ts'
import { VideoDetailed } from './video.ts'

export const SearchResult = Schema.Union(
  SongDetailed,
  VideoDetailed,
  AlbumDetailed,
  ArtistDetailed,
  PlaylistDetailed,
)
export type SearchResult = Schema.Schema.Type<typeof SearchResult>

export const HomeSection = Schema.Struct({
  title: Schema.NonEmptyTrimmedString,
  contents: Schema.Array(
    Schema.Union(AlbumDetailed, PlaylistDetailed, SongDetailed),
  ),
})
export type HomeSection = Schema.Schema.Type<typeof HomeSection>

export const UpNextsDetails = Schema.Struct({
  type: Schema.Literal('SONG'),
  videoId: Schema.NonEmptyTrimmedString,
  title: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  duration: Schema.NullOr(Schema.Int.pipe(Schema.nonNegative())),
  thumbnails: Schema.Array(ThumbnailFull),
})
export type UpNextsDetails = Schema.Schema.Type<typeof UpNextsDetails>
