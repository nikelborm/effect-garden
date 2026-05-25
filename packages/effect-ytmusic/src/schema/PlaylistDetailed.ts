import * as Schema from 'effect/Schema'

import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const PlaylistDetailed = Schema.Struct({
  type: Schema.Literal('PLAYLIST'),
  playlistId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  thumbnails: Schema.Array(ThumbnailFull),
}).annotations({ title: 'PlaylistDetailed' })

export type PlaylistDetailed = Schema.Schema.Type<typeof PlaylistDetailed>
