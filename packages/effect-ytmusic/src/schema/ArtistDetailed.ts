import * as Schema from 'effect/Schema'

import { ThumbnailFull } from './ThumbnailFull.ts'

export const ArtistDetailed = Schema.Struct({
  type: Schema.Literal('ARTIST'),
  artistId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
  thumbnails: Schema.Array(ThumbnailFull),
}).annotations({ title: 'ArtistDetailed' })

export type ArtistDetailed = Schema.Schema.Type<typeof ArtistDetailed>
