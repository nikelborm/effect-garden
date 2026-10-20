import * as Effect from 'effect/Effect'
import { flow } from 'effect/Function'
import * as Schema from 'effect/Schema'

import {
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../../domain/AssetPointer.ts'
import {
  type Chord,
  type ChordData,
  ChordSchema,
  defaultChord,
} from '../../../domain/Chord.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import {
  matchParamButtonId,
  type PressedParamButtonId,
} from '../../../domain/PressedParamButtonId.ts'
import {
  defaultStrength,
  type Strength,
  type StrengthData,
  StrengthSchema,
} from '../../../domain/Strength.ts'
import type { AdvanceFnReturn } from '../index.ts'
import { PatternState } from './Pattern⏳.ts'
import { SlowStrumState } from './SlowStrum.ts'

export const SilenceQueue = Schema.Tuple([])

// !!!VERIFIED!!!

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class SilenceState extends Schema.TaggedClass<SilenceState>()(
  'SilenceState',
  {
    chord: ChordSchema,
    strength: StrengthSchema,
    transitionQueue: SilenceQueue,
  },
) {
  declare protected '~brand~': never
  static models = Schema.is(this);

  /** 🏁 */
  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    return yield* matchParamButtonId(pressedParamButtonId)({
      onChord: flow(this.getAssetToPlay, SlowStrumState.init),
      onPattern: flow(this.getAssetToPlay, PatternState.init),
      onStrength: flow(this.withNewStrengthFromData, Effect.succeed),
    })
  }

  /** 🏁 */
  static makeSimple = (chord: Chord, strength: Strength) =>
    this.make({ chord, strength, transitionQueue: [] })

  /** 🏁 */
  static default = this.makeSimple(defaultChord, defaultStrength)

  /** 🏁 */
  withNewStrengthFromData = (container: StrengthData) =>
    SilenceState.makeSimple(this.chord, container.strength)

  /** 🏁 */
  withNewChordFromData = (container: ChordData) =>
    SilenceState.makeSimple(container.chord, this.strength)

  /** 🏁 */
  getAssetToPlay = <T extends PatternData | ChordData>(
    pressedParamButtonId: T,
  ) =>
    (PatternData.models(pressedParamButtonId)
      ? TaggedPatternPointer.makeSimple(
          pressedParamButtonId.pattern,
          this.chord,
          this.strength,
        )
      : TaggedSlowStrumPointer.makeSimple(
          pressedParamButtonId.chord,
          this.strength,
        )) as T extends any // distrubute
      ? T extends PatternData
        ? TaggedPatternPointer
        : T extends ChordData
          ? TaggedSlowStrumPointer
          : never
      : never
}
