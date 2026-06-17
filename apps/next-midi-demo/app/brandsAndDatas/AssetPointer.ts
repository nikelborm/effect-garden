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
  static {
    this.make = this.make.bind(this)
  }
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
  static {
    this.make = this.make.bind(this)
  }
}

export type SlowStrumPointer = Omit<TaggedSlowStrumPointer, '_tag'>

export const AssetPointerSchema = Schema.Union(
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
)

export type AssetPointer = TaggedPatternPointer | TaggedSlowStrumPointer

export const complexifyAssetPointer = ({
  pattern: patternOption,
  ...other
}: SimpleAssetPointer) =>
  Option.match(patternOption, {
    onNone: () => TaggedSlowStrumPointer.make(other),
    onSome: pattern => TaggedPatternPointer.make({ ...other, pattern }),
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

export interface SimpleAssetPointer {
  readonly accord: Accord
  readonly pattern: PatternOption
  readonly strength: Strength
}
