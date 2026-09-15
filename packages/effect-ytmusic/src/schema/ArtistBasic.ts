import * as Schema from 'effect/Schema'

export const ArtistBasic = Schema.Struct({
  artistId: Schema.NullOr(Schema.Trimmed.check(Schema.isNonEmpty())),
  name: Schema.Trimmed.check(Schema.isNonEmpty()),
}).annotateKey({ title: 'ArtistBasic' })

export type ArtistBasic = Schema.Schema.Type<typeof ArtistBasic>
