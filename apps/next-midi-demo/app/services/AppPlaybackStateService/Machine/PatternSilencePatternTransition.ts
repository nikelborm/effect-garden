import * as Equal from 'effect/Equal'
import * as Schema from 'effect/Schema'

import { desiredAssetFromSignal } from '../../../domain/desiredAssetFromSignal.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  theSameAccordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../helpers/theSameWasPressed.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import type { AdvanceFnReturn } from '../index.ts'
import {
  getAudioNow,
  IncomingPatternFadingIn,
  PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
} from '../loopElements.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternState } from './Pattern.ts'
import { PatternPatternPatternTransitionState } from './PatternPatternPatternTransition.ts'
import { PatternPatternSilenceTransitionState } from './PatternPatternSilenceTransition.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternSilenceTransitionState } from './PatternSilenceTransition.ts'

export const PatternSilencePatternTransitionQueue = Schema.Tuple([
  PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
  IncomingPatternFadingIn,
])
export const isPatternSilencePatternTransitionQueue = Schema.is(
  PatternSilencePatternTransitionQueue,
)

export class PatternSilencePatternTransitionState extends Schema.TaggedClass<PatternSilencePatternTransitionState>()(
  'PatternSilencePatternTransitionState',
  {
    playbackStartedAtSecond: Schema.Finite,
    transitionQueue: PatternSilencePatternTransitionQueue,
  },
) {
  declare protected '~brand~': never
  static models = Schema.is(this);

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const [dying, incoming] = this.transitionQueue

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
        firstPlaybackInitAtSecond: revived.playbackStartedAtSecond,
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
