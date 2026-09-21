import * as Schema from 'effect/Schema'

export const ThumbnailFull = Schema.Struct({
  url: Schema.Trimmed.check(Schema.isNonEmpty()),
  width: Schema.Int.check(Schema.isGreaterThan(0)),
  height: Schema.Int.check(Schema.isGreaterThan(0)),
}).annotateKey({ title: 'ThumbnailFull' })

export type ThumbnailFull = Schema.Schema.Type<typeof ThumbnailFull>
