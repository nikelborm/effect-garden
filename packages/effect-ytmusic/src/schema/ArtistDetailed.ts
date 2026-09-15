import * as Schema from 'effect/Schema'

import { ThumbnailFull } from './ThumbnailFull.ts'

export const ArtistDetailed = Schema.Struct({
  type: Schema.Literal('ARTIST'),
  artistId: Schema.Trimmed.check(Schema.isNonEmpty()),
  name: Schema.Trimmed.check(Schema.isNonEmpty()),
  thumbnails: Schema.Array(ThumbnailFull),
}).annotateKey({ title: 'ArtistDetailed' })

export type ArtistDetailed = Schema.Schema.Type<typeof ArtistDetailed>
