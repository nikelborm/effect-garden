import * as Schema from 'effect/Schema'

import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const PlaylistFull = Schema.Struct({
  type: Schema.Literal('PLAYLIST'),
  playlistId: Schema.Trimmed.check(Schema.isNonEmpty()),
  name: Schema.Trimmed.check(Schema.isNonEmpty()),
  artist: ArtistBasic,
  videoCount: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  thumbnails: Schema.Array(ThumbnailFull),
}).annotateKey({ title: 'PlaylistFull' })

export type PlaylistFull = Schema.Schema.Type<typeof PlaylistFull>
