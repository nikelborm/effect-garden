import * as Schema from 'effect/Schema'

import { AlbumDetailed } from './AlbumDetailed.ts'
import { ArtistDetailed } from './ArtistDetailed.ts'
import { PlaylistDetailed } from './PlaylistDetailed.ts'
import { SongDetailed } from './SongDetailed.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'
import { VideoDetailed } from './VideoDetailed.ts'

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
}).annotations({ title: 'ArtistFull' })

export type ArtistFull = Schema.Schema.Type<typeof ArtistFull>
