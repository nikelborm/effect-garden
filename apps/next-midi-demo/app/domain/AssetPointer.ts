import { AbsentProperty } from '@evadev/effect-helpers/AbsentProperty'

import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

import { type Accord, AccordData, AccordSchema } from './Accord.ts'
import {
  type Pattern,
  PatternData,
  type PatternOption,
  PatternSchema,
} from './Pattern.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'
import { type Strength, type StrengthData, StrengthSchema } from './Strength.ts'

export class TaggedPatternPointer extends Schema.TaggedClass<TaggedPatternPointer>()(
  'TaggedPatternPointer',
  {
    pattern: PatternSchema,
    accord: AccordSchema,
    strength: StrengthSchema,
  },
) {
  declare protected '~brand~': never
  static models = Schema.is(this)
  static {
    // to be able to pass a callback to array mappers for example
    this.make = this.make.bind(this)
  }
  static makeSimple = (pattern: Pattern, accord: Accord, strength: Strength) =>
    this.make({ accord, pattern, strength })

  makePatchedFrom = (pressedParamButtonId: PressedParamButtonId) =>
    PatternData.models(pressedParamButtonId)
      ? TaggedPatternPointer.makeSimple(
          pressedParamButtonId.pattern,
          this.accord,
          this.strength,
        )
      : AccordData.models(pressedParamButtonId)
        ? TaggedPatternPointer.makeSimple(
            this.pattern,
            pressedParamButtonId.accord,
            this.strength,
          )
        : TaggedPatternPointer.makeSimple(
            this.pattern,
            this.accord,
            pressedParamButtonId.strength,
          )
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
  declare protected '~brand~': never
  static models = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }

  static makeSimple = (accord: Accord, strength: Strength) =>
    this.make({ accord, strength })

  patch = (pressedParamButtonId: AccordData | StrengthData) =>
    AccordData.models(pressedParamButtonId)
      ? TaggedSlowStrumPointer.makeSimple(
          pressedParamButtonId.accord,
          this.strength,
        )
      : TaggedSlowStrumPointer.makeSimple(
          this.accord,
          pressedParamButtonId.strength,
        )
}

export type SlowStrumPointer = Omit<TaggedSlowStrumPointer, '_tag'>

export const AssetPointerSchema = Schema.Union([
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
])

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
