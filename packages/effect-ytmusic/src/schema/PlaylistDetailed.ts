import * as Schema from 'effect/Schema'

import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const PlaylistDetailed = Schema.Struct({
  type: Schema.Literal('PLAYLIST'),
  playlistId: Schema.Trimmed.check(Schema.isNonEmpty()),
  name: Schema.Trimmed.check(Schema.isNonEmpty()),
  artist: ArtistBasic,
  thumbnails: Schema.Array(ThumbnailFull),
}).annotateKey({ title: 'PlaylistDetailed' })

export type PlaylistDetailed = Schema.Schema.Type<typeof PlaylistDetailed>
