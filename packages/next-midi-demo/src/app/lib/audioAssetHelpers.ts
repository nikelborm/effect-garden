import * as Schema from 'effect/Schema'

export type AssetPointer = TaggedPatternPointer

export const StrengthSchema = Schema.Literal('s', 'm', 'v')
export type Strength = (typeof StrengthSchema)['Type']

export class TaggedPatternPointer extends Schema.TaggedClass<TaggedPatternPointer>()(
  'pattern',
  {
    strength: StrengthSchema,
  },
) {}
