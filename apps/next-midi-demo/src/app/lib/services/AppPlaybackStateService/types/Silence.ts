import * as Schema from 'effect/Schema'

export const SilenceSchema = Schema.Struct({
  _tag: Schema.Literal('Silence'),
})
export type Silence = Schema.Schema.Type<typeof SilenceSchema>
