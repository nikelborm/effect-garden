import * as Schema from 'effect/Schema'

export const AlbumBasic = Schema.Struct({
  albumId: Schema.NonEmptyTrimmedString,
  name: Schema.NonEmptyTrimmedString,
}).annotations({ title: 'AlbumBasic' })

export type AlbumBasic = Schema.Schema.Type<typeof AlbumBasic>
