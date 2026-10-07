import * as Equal from 'effect/Equal'
import * as Schema from 'effect/Schema'

import { AccordData } from '../../../../domain/Accord.ts'
import { desiredAssetFromSignal } from '../../../../domain/desiredAssetFromSignal.ts'
import { PatternData } from '../../../../domain/Pattern.ts'
import type { PressedParamButtonId } from '../../../../domain/PressedParamButtonId.ts'
import { StrengthData } from '../../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../../constants.ts'
import type { AdvanceFnReturn } from '../../index.ts'
import { getAudioNow } from '../../loopElements.ts'
import { PatternPatternSilenceTransitionState } from '../../SilenceBound/PatternPatternSilenceTransition/State.ts'
import { PatternSilenceTransitionState } from '../../SilenceBound/PatternSilenceTransition/State.ts'
import { PatternBoundBaseState } from '../PatternBoundBase/State.ts'
import { PatternState } from '../Pattern/State.ts'
import { PatternPatternPatternTransitionState } from '../PatternPatternPatternTransition/State.ts'
import { PatternSilencePatternTransitionQueue } from './Queue.ts'

export class PatternSilencePatternTransitionState extends PatternBoundBaseState.extend<PatternSilencePatternTransitionState>(
  'PatternSilencePatternTransitionState',
)({
  transitionQueue: PatternSilencePatternTransitionQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternSilencePatternTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const [dying, incoming] = this.transitionQueue

    if (
      (AccordData.models(pressedParamButtonId) &&
        pressedParamButtonId.accord === incoming.asset.accord) ||
      (StrengthData.models(pressedParamButtonId) &&
        pressedParamButtonId.strength === incoming.asset.strength)
    )
      return this

    const now = yield* getAudioNow

    const isInGreenZone =
      now <= incoming.fadeInStartsAtSecond - schedulingSafeBufferInSeconds

    if (
      PatternData.models(pressedParamButtonId) &&
      pressedParamButtonId.pattern === incoming.asset.pattern
    ) {
      if (isInGreenZone) {
        yield* incoming.drop()
        return PatternSilenceTransitionState.make({
          accord: incoming.asset.accord,
          strength: incoming.asset.strength,
          transitionQueue: [dying],
        })
      }

      return PatternPatternSilenceTransitionState.make({
        accord: incoming.asset.accord,
        strength: incoming.asset.strength,
        transitionQueue: [dying, yield* incoming.promoteToFadeToSilence()],
      })
    }

    const desiredAsset = desiredAssetFromSignal(
      pressedParamButtonId,
      incoming.asset,
    )

    if (isInGreenZone && Equal.equals(desiredAsset, dying.asset)) {
      const revived = yield* dying.cancelFadeoutAndRestore()
      yield* incoming.drop()
      return PatternState.make({
        playbackStartedAtSecond: revived.playbackStartedAtSecond,
        transitionQueue: [revived],
      })
    }

    if (!isInGreenZone) {
      return PatternPatternPatternTransitionState.make({
        playbackStartedAtSecond: dying.playbackStartedAtSecond,
        transitionQueue: [
          dying,
          yield* incoming.promoteToFadingOut(),
          yield* dying.scheduleNextPattern(desiredAsset),
        ],
      })
    }

    yield* incoming.drop()
    return PatternSilencePatternTransitionState.make({
      playbackStartedAtSecond: dying.playbackStartedAtSecond,
      transitionQueue: [dying, yield* dying.scheduleNextPattern(desiredAsset)],
    })
  }
}
