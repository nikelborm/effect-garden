import * as Schema from 'effect/Schema'

export const ArtistBasic = Schema.Struct({
  artistId: Schema.NullOr(Schema.NonEmptyTrimmedString),
  name: Schema.NonEmptyTrimmedString,
}).annotations({ title: 'ArtistBasic' })

export type ArtistBasic = Schema.Schema.Type<typeof ArtistBasic>
