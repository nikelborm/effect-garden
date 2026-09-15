import * as Schema from 'effect/Schema'

export const ThumbnailFull = Schema.Struct({
  url: Schema.Trimmed.check(Schema.isNonEmpty()),
  width: Schema.Int.pipe(Schema.positive()),
  height: Schema.Int.pipe(Schema.positive()),
}).annotateKey({ title: 'ThumbnailFull' })

export type ThumbnailFull = Schema.Schema.Type<typeof ThumbnailFull>
