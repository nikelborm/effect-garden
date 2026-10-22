import { AbsentProperty } from '@evadev/effect-helpers/AbsentProperty'

import * as Arbitrary from 'effect/Arbitrary'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

import {
  type Chord,
  ChordData,
  Chordify,
  type ChordRawBase,
  ChordSchema,
} from './Chord.ts'
import {
  type Pattern,
  PatternData,
  Patternify,
  type PatternOption,
  type PatternRawBase,
  PatternSchema,
} from './Pattern.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'
import {
  type Strength,
  type StrengthData,
  Strengthify,
  type StrengthRawBase,
  StrengthSchema,
} from './Strength.ts'

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class TaggedPatternPointer extends Schema.TaggedClass<TaggedPatternPointer>()(
  'TaggedPatternPointer',
  { pattern: PatternSchema, chord: ChordSchema, strength: StrengthSchema },
) {
  declare protected '~brand~': never
  static models = Schema.is(this)
  static {
    // to be able to pass a callback to array mappers for example
    this.make = this.make.bind(this)
  }
  static makeSimple = (pattern: Pattern, chord: Chord, strength: Strength) =>
    this.make({ chord, pattern, strength })

  static makeSimpleGeneric = <
    const TP extends PatternRawBase,
    const TC extends ChordRawBase,
    const TS extends StrengthRawBase,
  >(
    pattern: TP,
    chord: TC,
    strength: TS,
  ) =>
    this.make({
      chord: Chordify(chord),
      pattern: Patternify(pattern),
      strength: Strengthify(strength),
    }) as TaggedPatternPointer & { pattern: TP; chord: TC; strength: TS }

  makePatchedFrom(pressedParamButtonId: PressedParamButtonId) {
    return PatternData.models(pressedParamButtonId)
      ? TaggedPatternPointer.makeSimple(
          pressedParamButtonId.pattern,
          this.chord,
          this.strength,
        )
      : ChordData.models(pressedParamButtonId)
        ? TaggedPatternPointer.makeSimple(
            this.pattern,
            pressedParamButtonId.chord,
            this.strength,
          )
        : TaggedPatternPointer.makeSimple(
            this.pattern,
            this.chord,
            pressedParamButtonId.strength,
          )
  }
}

export const TaggedPatternPointerArbitrary =
  Arbitrary.schema(TaggedPatternPointer)

export type PatternPointer = Omit<TaggedPatternPointer, '_tag'>

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class TaggedSlowStrumPointer extends Schema.TaggedClass<TaggedSlowStrumPointer>()(
  'TaggedSlowStrumPointer',
  { pattern: AbsentProperty, chord: ChordSchema, strength: StrengthSchema },
) {
  declare protected '~brand~': never
  static models = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }

  static makeSimple = (chord: Chord, strength: Strength) =>
    this.make({ chord, strength })

  static makeSimpleGeneric = <
    const TC extends ChordRawBase,
    const TS extends StrengthRawBase,
  >(
    chord: TC,
    strength: TS,
  ) =>
    this.make({
      chord: Chordify(chord),
      strength: Strengthify(strength),
    }) as TaggedSlowStrumPointer & { chord: TC; strength: TS }

  patch(pressedParamButtonId: ChordData | StrengthData) {
    return ChordData.models(pressedParamButtonId)
      ? TaggedSlowStrumPointer.makeSimple(
          pressedParamButtonId.chord,
          this.strength,
        )
      : TaggedSlowStrumPointer.makeSimple(
          this.chord,
          pressedParamButtonId.strength,
        )
  }
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
  chord: asset.chord,
  pattern: TaggedPatternPointer.models(asset)
    ? Option.some(asset.pattern)
    : Option.none(),
  strength: asset.strength,
})

export interface SimpleAssetPointer {
  readonly chord: Chord
  readonly pattern: PatternOption
  readonly strength: Strength
}
