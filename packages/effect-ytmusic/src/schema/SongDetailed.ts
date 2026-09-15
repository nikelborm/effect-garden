import * as Schema from 'effect/Schema'

import { AlbumBasic } from './AlbumBasic.ts'
import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const SongDetailed = Schema.Struct({
  type: Schema.Literal('SONG'),
  videoId: Schema.Trimmed.check(Schema.isNonEmpty()),
  name: Schema.Trimmed.check(Schema.isNonEmpty()),
  artist: ArtistBasic,
  album: Schema.NullOr(AlbumBasic),
  duration: Schema.NullOr(Schema.Int.check(Schema.isGreaterThanOrEqualTo(0))),
  thumbnails: Schema.Array(ThumbnailFull),
}).annotateKey({ title: 'SongDetailed' })

export type SongDetailed = Schema.Schema.Type<typeof SongDetailed>
