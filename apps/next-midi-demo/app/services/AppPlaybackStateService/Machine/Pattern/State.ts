import * as Schema from 'effect/Schema'

import { desiredAssetFromSignal } from '../../../../domain/desiredAssetFromSignal.ts'
import type { PressedParamButtonId } from '../../../../domain/PressedParamButtonId.ts'
import {
  theSameAccordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../../helpers/theSameWasPressed.ts'
import type { AdvanceFnReturn } from '../../index.ts'
import { PatternBoundBaseState } from '../PatternBoundBase/State.ts'
import { PatternPatternTransitionState } from '../PatternPatternTransition/State.ts'
import { PatternSilenceTransitionState } from '../PatternSilenceTransition/State.ts'
import { PatternQueue } from './Queue.ts'

export class PatternState extends PatternBoundBaseState.extend<PatternState>(
  'PatternState',
)({
  transitionQueue: PatternQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is PatternState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const [playing] = this.transitionQueue

    if (theSameAccordOrStrengthWasPressed(pressedParamButtonId, playing.asset))
      return this

    if (theSamePatternWasPressed(pressedParamButtonId, playing.asset))
      return PatternSilenceTransitionState.make({
        accord: playing.asset.accord,
        strength: playing.asset.strength,
        transitionQueue: [yield* playing.beginLongFadeoutToSilence()],
      })

    const asset = desiredAssetFromSignal(pressedParamButtonId, playing.asset)
    return PatternPatternTransitionState.make({
      playbackStartedAtSecond: playing.playbackStartedAtSecond,
      transitionQueue: [
        yield* playing.beginShortFadeoutBeforeAnotherPattern(),
        yield* playing.scheduleNextPattern(asset),
      ],
    })
  }
}
