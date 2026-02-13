import * as Schema from 'effect/Schema'

export const StrengthSchema = Schema.Literal('s', 'm', 'v')
export type Strength = (typeof StrengthSchema)['Type']
