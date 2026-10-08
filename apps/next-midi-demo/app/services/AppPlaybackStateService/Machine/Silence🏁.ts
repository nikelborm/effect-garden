import * as Effect from 'effect/Effect'
import { flow } from 'effect/Function'
import * as Schema from 'effect/Schema'

import {
  type Accord,
  type AccordData,
  AccordSchema,
  defaultAccord,
} from '../../../domain/Accord.ts'
import {
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../../domain/AssetPointer.ts'
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
export const isSilenceQueue = Schema.is(SilenceQueue)

// !!!VERIFIED!!!

export class SilenceState extends Schema.TaggedClass<SilenceState>()(
  'SilenceState',
  {
    accord: AccordSchema,
    strength: StrengthSchema,
    transitionQueue: SilenceQueue,
  },
) {
  declare protected '~brand~': never
  static models = Schema.is(this);

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    return yield* matchParamButtonId(pressedParamButtonId)({
      onAccord: flow(this.getAssetToPlay, SlowStrumState.init),
      onPattern: flow(this.getAssetToPlay, PatternState.init),
      onStrength: flow(this.withNewStrengthFromData, Effect.succeed),
    })
  }

  static makeSimple = (accord: Accord, strength: Strength) =>
    this.make({ accord, strength, transitionQueue: [] })

  static default = this.makeSimple(defaultAccord, defaultStrength)

  withNewStrengthFromData = (container: StrengthData) =>
    SilenceState.makeSimple(this.accord, container.strength)

  withNewAccordFromData = (container: AccordData) =>
    SilenceState.makeSimple(container.accord, this.strength)

  getAssetToPlay = <T extends PatternData | AccordData>(
    pressedParamButtonId: T,
  ) =>
    (PatternData.models(pressedParamButtonId)
      ? TaggedPatternPointer.make({
          pattern: pressedParamButtonId.pattern,
          accord: this.accord,
          strength: this.strength,
        })
      : TaggedSlowStrumPointer.make({
          accord: pressedParamButtonId.accord,
          strength: this.strength,
        })) as T extends any // distrubute
      ? T extends PatternData
        ? TaggedPatternPointer
        : T extends AccordData
          ? TaggedSlowStrumPointer
          : never
      : never
}
