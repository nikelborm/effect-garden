/** biome-ignore-all lint/complexity/useLiteralKeys: incompatibility with TS */

import { AbsentProperty } from '@evadev/effect-helpers'

import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

import { type Accord, AccordSchema } from './Accord.ts'
import { type PatternOption, PatternSchema } from './Pattern.ts'
import { type Strength, StrengthSchema } from './Strength.ts'

export class TaggedPatternPointer extends Schema.TaggedClass<TaggedPatternPointer>()(
  'TaggedPatternPointer',
  {
    pattern: PatternSchema,
    accord: AccordSchema,
    strength: StrengthSchema,
  },
) {
  private declare '~brand~': never
  static models: (candidate: unknown) => candidate is TaggedPatternPointer =
    Schema.is(this)
}

export type PatternPointer = Omit<TaggedPatternPointer, '_tag'>

export class TaggedSlowStrumPointer extends Schema.TaggedClass<TaggedSlowStrumPointer>()(
  'TaggedSlowStrumPointer',
  {
    pattern: AbsentProperty,
    accord: AccordSchema,
    strength: StrengthSchema,
  },
) {
  private declare '~brand~': never
  static models: (candidate: unknown) => candidate is TaggedSlowStrumPointer =
    Schema.is(this)
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
  readonly pattern: PatternOption
  readonly accord: Accord
}): AssetPointer =>
  Option.match(pattern, {
    onNone: () => TaggedSlowStrumPointer.make({ accord, strength }),
    onSome: pattern =>
      TaggedPatternPointer.make({
        accord,
        pattern,
        strength,
      }),
  })

export const simplifyAssetPointer = (
  asset: AssetPointer,
): SimpleAssetPointer => ({
  accord: asset.accord,
  pattern: TaggedPatternPointer.models(asset)
    ? Option.some(asset.pattern)
    : Option.none(),
  strength: asset.strength,
})

export const desimplifyAssetPointer = ({
  pattern,
  ...other
}: SimpleAssetPointer) =>
  Option.match(pattern, {
    onNone: () => TaggedSlowStrumPointer.make(other),
    onSome: pattern => TaggedPatternPointer.make({ ...other, pattern }),
  })

export interface SimpleAssetPointer {
  accord: Accord
  pattern: PatternOption
  strength: Strength
}
