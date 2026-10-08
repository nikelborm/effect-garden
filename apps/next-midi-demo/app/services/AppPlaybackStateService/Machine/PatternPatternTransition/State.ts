import * as Equal from 'effect/Equal'
import * as Schema from 'effect/Schema'

import { desiredAssetFromSignal } from '../../../../domain/desiredAssetFromSignal.ts'
import type { PressedParamButtonId } from '../../../../domain/PressedParamButtonId.ts'
import {
  theSameAccordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../../helpers/theSameWasPressed.ts'
import { schedulingSafeBufferInSeconds } from '../../constants.ts'
import type { AdvanceFnReturn } from '../../index.ts'
import { getAudioNow } from '../../loopElements.ts'
import { PatternState } from '../Pattern/State.ts'
import { PatternPatternPatternTransitionState } from '../PatternPatternPatternTransition/State.ts'
import { PatternPatternSilenceTransitionState } from '../PatternPatternSilenceTransition/State.ts'
import { PatternSilenceTransitionState } from '../PatternSilenceTransition/State.ts'
import { PatternPatternTransitionQueue } from './Queue.ts'

export class PatternPatternTransitionState extends Schema.TaggedClass<PatternPatternTransitionState>()(
  'PatternPatternTransitionState',
  {
    playbackStartedAtSecond: Schema.Finite,
    transitionQueue: PatternPatternTransitionQueue,
  },
) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternPatternTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const [current, incoming] = this.transitionQueue

    if (theSameAccordOrStrengthWasPressed(pressedParamButtonId, incoming.asset))
      return this

    const now = yield* getAudioNow

    const isInGreenZone =
      now <= incoming.fadeInStartsAtSecond - schedulingSafeBufferInSeconds

    if (theSamePatternWasPressed(pressedParamButtonId, incoming.asset)) {
      if (isInGreenZone) {
        yield* incoming.drop()
        return PatternSilenceTransitionState.make({
          accord: incoming.asset.accord,
          strength: incoming.asset.strength,
          transitionQueue: [current],
        })
      }

      return PatternPatternSilenceTransitionState.make({
        accord: incoming.asset.accord,
        strength: incoming.asset.strength,
        transitionQueue: [current, yield* incoming.promoteToFadingOut()],
      })
    }

    const desiredAsset = desiredAssetFromSignal(
      pressedParamButtonId,
      incoming.asset,
    )

    if (isInGreenZone && Equal.equals(desiredAsset, current.asset)) {
      const revived = yield* current.cancelFadeoutAndRestore()
      yield* incoming.drop()
      return PatternState.make({
        playbackStartedAtSecond: revived.playbackStartedAtSecond,
        transitionQueue: [revived],
      })
    }

    if (!isInGreenZone) {
      return PatternPatternPatternTransitionState.make({
        playbackStartedAtSecond: current.playbackStartedAtSecond,
        transitionQueue: [
          current,
          yield* incoming.promoteToFadingOut(),
          yield* current.scheduleNextPattern(desiredAsset),
        ],
      })
    }

    yield* incoming.drop()
    return PatternPatternTransitionState.make({
      playbackStartedAtSecond: current.playbackStartedAtSecond,
      transitionQueue: [
        yield* current.reanchorFadeoutOnto(),
        yield* current.scheduleNextPattern(desiredAsset),
      ],
    })
  }
}
