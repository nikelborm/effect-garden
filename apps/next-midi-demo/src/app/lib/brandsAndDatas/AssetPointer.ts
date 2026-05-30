/** biome-ignore-all lint/complexity/useLiteralKeys: incompatibility with TS */
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

import {
  type AccordIndex,
  AccordIndexSchema,
  type AllAccordUnion,
} from './Accord.ts'
import {
  type AllPatternUnion,
  type PatternIndex,
  PatternIndexSchema,
} from './Pattern.ts'
import { type Strength, StrengthSchema } from './Strength.ts'

export class TaggedPatternPointer extends Schema.TaggedClass<TaggedPatternPointer>()(
  'TaggedPatternPointer',
  {
    patternIndex: PatternIndexSchema,
    accordIndex: AccordIndexSchema,
    strength: StrengthSchema,
  },
) {
  static models = Schema.is(this) as (p: unknown) => p is TaggedPatternPointer
}

export type PatternPointer = Omit<TaggedPatternPointer, '_tag'>

export class TaggedSlowStrumPointer extends Schema.TaggedClass<TaggedSlowStrumPointer>()(
  'TaggedSlowStrumPointer',
  {
    patternIndex: Schema.Never.pipe(Schema.optionalWith({ exact: true })),
    accordIndex: AccordIndexSchema,
    strength: StrengthSchema,
  },
) {
  static models = Schema.is(this) as (p: unknown) => p is TaggedSlowStrumPointer
}

export type SlowStrumPointer = Omit<TaggedSlowStrumPointer, '_tag'>

export const AssetPointerSchema = Schema.Union(
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
)

export type AssetPointer = TaggedPatternPointer | TaggedSlowStrumPointer

export const complexifyAssetPointer = ({
  accord,
  pattern,
  strength,
}: {
  readonly strength: Strength
  readonly pattern: Option.Option<AllPatternUnion>
  readonly accord: AllAccordUnion
}): AssetPointer =>
  Option.match(pattern, {
    onNone: () =>
      TaggedSlowStrumPointer.make({ accordIndex: accord.index, strength }),
    onSome: pattern =>
      TaggedPatternPointer.make({
        accordIndex: accord.index,
        patternIndex: pattern.index,
        strength,
      }),
  })

export const simplifyAssetPointer = (
  asset: AssetPointer,
): SimpleAssetPointer => ({
  accordIndex: asset.accordIndex,
  patternIndex: TaggedPatternPointer.models(asset)
    ? Option.some(asset.patternIndex)
    : Option.none(),
  strength: asset.strength,
})

export const desimplifyAssetPointer = ({
  patternIndex: patternIndexOption,
  ...other
}: SimpleAssetPointer) =>
  Option.match(patternIndexOption, {
    onNone: () => TaggedSlowStrumPointer.make(other),
    onSome: patternIndex =>
      TaggedPatternPointer.make({ ...other, patternIndex }),
  })

export interface SimpleAssetPointer {
  accordIndex: AccordIndex
  patternIndex: Option.Option<PatternIndex>
  strength: Strength
}
