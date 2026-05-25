import * as Schema from 'effect/Schema'

import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const PlaylistFull = Schema.Struct({
  type: Schema.Literal('PLAYLIST'),
  playlistId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  artist: ArtistBasic,
  videoCount: Schema.Int.pipe(Schema.nonNegative()),
  thumbnails: Schema.Array(ThumbnailFull),
}).annotations({ title: 'PlaylistFull' })

export type PlaylistFull = Schema.Schema.Type<typeof PlaylistFull>
