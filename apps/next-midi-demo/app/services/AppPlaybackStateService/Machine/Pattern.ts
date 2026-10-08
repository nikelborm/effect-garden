import * as Schema from 'effect/Schema'

import { desiredAssetFromSignal } from '../../../domain/desiredAssetFromSignal.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  theSameAccordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../helpers/theSameWasPressed.ts'
import type { AdvanceFnReturn } from '../index.ts'
import { PatternPlayback } from '../loopElements.ts'
import { PatternPatternTransitionState } from './PatternPatternTransition.ts'
import { PatternSilenceTransitionState } from './PatternSilenceTransition.ts'

export const PatternQueue = Schema.Tuple([PatternPlayback])
export const isPatternQueue = Schema.is(PatternQueue)

export class PatternState extends Schema.TaggedClass<PatternState>()(
  'PatternState',
  { playbackStartedAtSecond: Schema.Finite, transitionQueue: PatternQueue },
) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is PatternState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const [current] = this.transitionQueue

    if (theSameAccordOrStrengthWasPressed(pressedParamButtonId, current.asset))
      return this

    if (theSamePatternWasPressed(pressedParamButtonId, current.asset))
      return PatternSilenceTransitionState.make({
        accord: current.asset.accord,
        strength: current.asset.strength,
        transitionQueue: [yield* current.beginLongFadeoutToSilence()],
      })

    const asset = desiredAssetFromSignal(pressedParamButtonId, current.asset)
    return PatternPatternTransitionState.make({
      playbackStartedAtSecond: current.playbackStartedAtSecond,
      transitionQueue: [
        yield* current.beginShortFadeoutBeforeAnotherPattern(),
        yield* current.scheduleNextPattern(asset),
      ],
    })
  }
}
