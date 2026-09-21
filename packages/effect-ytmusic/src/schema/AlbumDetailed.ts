import * as Schema from 'effect/Schema'

import { ArtistBasic } from './ArtistBasic.ts'
import { ThumbnailFull } from './ThumbnailFull.ts'

export const AlbumDetailed = Schema.Struct({
  type: Schema.Literal('ALBUM'),
  albumId: Schema.Trimmed.check(Schema.isNonEmpty()),
  playlistId: Schema.Trimmed.check(Schema.isNonEmpty()),
  name: Schema.Trimmed.check(Schema.isNonEmpty()),
  artist: ArtistBasic,
  year: Schema.NullOr(
    Schema.Int.check(Schema.isBetween({ minimum: 1900, maximum: 2100 })),
  ),
  thumbnails: Schema.Array(ThumbnailFull),
}).annotateKey({ title: 'AlbumDetailed' })

export type AlbumDetailed = Schema.Schema.Type<typeof AlbumDetailed>
