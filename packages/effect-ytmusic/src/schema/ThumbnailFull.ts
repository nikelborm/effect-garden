import * as Schema from 'effect/Schema'

export const ThumbnailFull = Schema.Struct({
  url: Schema.NonEmptyTrimmedString,
  width: Schema.Int.pipe(Schema.positive()),
  height: Schema.Int.pipe(Schema.positive()),
}).annotations({ title: 'ThumbnailFull' })

export type ThumbnailFull = Schema.Schema.Type<typeof ThumbnailFull>
