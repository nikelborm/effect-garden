import * as Schema from 'effect/Schema'

export const NotPlayingSchema = Schema.Struct({
  _tag: Schema.Literal('NotPlaying'),
})
export type NotPlaying = Schema.Schema.Type<typeof NotPlayingSchema>
