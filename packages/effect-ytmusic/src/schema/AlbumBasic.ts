import * as Schema from 'effect/Schema'

export const AlbumBasic = Schema.Struct({
  albumId: Schema.Trimmed.check(Schema.isNonEmpty()),
  name: Schema.Trimmed.check(Schema.isNonEmpty()),
}).annotateKey({ title: 'AlbumBasic' })

export type AlbumBasic = Schema.Schema.Type<typeof AlbumBasic>
