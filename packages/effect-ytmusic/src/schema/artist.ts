import * as Schema from 'effect/Schema'

import { AlbumDetailed } from './album.ts'
import { ArtistBasic, ThumbnailFull } from './common.ts'
import { PlaylistDetailed } from './playlist.ts'
import { SongDetailed } from './song.ts'
import { VideoDetailed } from './video.ts'

export const ArtistDetailed = Schema.Struct({
  type: Schema.Literal('ARTIST'),
  artistId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  thumbnails: Schema.Array(ThumbnailFull),
})
export type ArtistDetailed = Schema.Schema.Type<typeof ArtistDetailed>

export const ArtistFull = Schema.Struct({
  type: Schema.Literal('ARTIST'),
  artistId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  thumbnails: Schema.Array(ThumbnailFull),
  topSongs: Schema.Array(SongDetailed),
  topAlbums: Schema.Array(AlbumDetailed),
  topSingles: Schema.Array(AlbumDetailed),
  topVideos: Schema.Array(VideoDetailed),
  featuredOn: Schema.Array(PlaylistDetailed),
  similarArtists: Schema.Array(ArtistDetailed),
})
export type ArtistFull = Schema.Schema.Type<typeof ArtistFull>

export { ArtistBasic }
