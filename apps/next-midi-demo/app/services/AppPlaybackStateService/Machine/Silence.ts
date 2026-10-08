import * as Schema from 'effect/Schema'

import {
  type Accord,
  type AccordData,
  AccordSchema,
  defaultAccord,
} from '../../../domain/Accord.ts'
import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../../domain/AssetPointer.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  defaultStrength,
  type Strength,
  StrengthData,
  StrengthSchema,
} from '../../../domain/Strength.ts'
import type { AdvanceFnReturn } from '../index.ts'
import { PatternState } from './Pattern.ts'
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
  static models: (candidate: unknown) => candidate is SilenceState =
    Schema.is(this);

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    if (StrengthData.models(pressedParamButtonId))
      return this.withNewStrengthFromData(pressedParamButtonId)

    const asset = this.getAssetToPlay(pressedParamButtonId)

    if (TaggedPatternPointer.models(asset))
      return yield* PatternState.init(asset)

    return yield* SlowStrumState.init(asset)
  }

  static makeSimple = (accord: Accord, strength: Strength) =>
    this.make({ accord, strength, transitionQueue: [] })

  static default = this.makeSimple(defaultAccord, defaultStrength)

  withNewStrengthFromData = (container: StrengthData) =>
    SilenceState.makeSimple(this.accord, container.strength)

  withNewAccordFromData = (container: AccordData) =>
    SilenceState.makeSimple(container.accord, this.strength)

  getAssetToPlay = (
    pressedParamButtonId: PatternData | AccordData,
  ): AssetPointer =>
    PatternData.models(pressedParamButtonId)
      ? TaggedPatternPointer.make({
          pattern: pressedParamButtonId.pattern,
          accord: this.accord,
          strength: this.strength,
        })
      : TaggedSlowStrumPointer.make({
          accord: pressedParamButtonId.accord,
          strength: this.strength,
        })
}
