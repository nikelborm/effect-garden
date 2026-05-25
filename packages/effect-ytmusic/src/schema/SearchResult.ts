import * as Schema from 'effect/Schema'

import { AlbumDetailed } from './AlbumDetailed.ts'
import { ArtistDetailed } from './ArtistDetailed.ts'
import { PlaylistDetailed } from './PlaylistDetailed.ts'
import { SongDetailed } from './SongDetailed.ts'
import { VideoDetailed } from './VideoDetailed.ts'

export const SearchResult = Schema.Union(
  SongDetailed,
  VideoDetailed,
  AlbumDetailed,
  ArtistDetailed,
  PlaylistDetailed,
).annotations({ title: 'SearchResult' })

export type SearchResult = Schema.Schema.Type<typeof SearchResult>
