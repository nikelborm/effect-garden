import * as Effect from 'effect/Effect'
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
  FadingOutPatternPlayback,
  getAudioNow,
  IncomingPatternFadingIn,
} from '../loopElements.ts'
import { PatternPatternSilenceTransitionState } from './PatternPatternSilenceTransition.ts'

export const PatternPatternPatternTransitionQueue = Schema.Tuple([
  FadingOutPatternPlayback,
  FadingOutPatternPlayback,
  IncomingPatternFadingIn,
])
export const isPatternPatternPatternTransitionQueue = Schema.is(
  PatternPatternPatternTransitionQueue,
)

export class PatternPatternPatternTransitionState extends Schema.TaggedClass<PatternPatternPatternTransitionState>()(
  'PatternPatternPatternTransitionState',
  {
    playbackStartedAtSecond: Schema.Finite,
    transitionQueue: PatternPatternPatternTransitionQueue,
  },
) {
  declare protected '~brand~': never
  static models = Schema.is(this);

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const [oldest, middle, incoming] = this.transitionQueue

    if (theSameAccordOrStrengthWasPressed(pressedParamButtonId, incoming.asset))
      return this

    const now = yield* getAudioNow

    const isInGreenZone =
      now <= incoming.fadeInStartsAtSecond - schedulingSafeBufferInSeconds

    if (theSamePatternWasPressed(pressedParamButtonId, incoming.asset)) {
      if (isInGreenZone) {
        yield* incoming.drop()
        return PatternPatternSilenceTransitionState.make({
          accord: incoming.asset.accord,
          strength: incoming.asset.strength,
          transitionQueue: [oldest, middle],
        })
      }
      yield* Effect.logError({
        oldest,
        middle,
        incoming,
        pressedParamButtonId,
      })
      return yield* Effect.die(
        new Error(
          'red-zone deselect during a full queue (a 4th input): would need a 3rd fading-to-silence loop — excluded from the MVP',
        ),
      )
    }

    if (!isInGreenZone) {
      yield* Effect.logError({
        oldest,
        middle,
        incoming,
        pressedParamButtonId,
      })
      return yield* Effect.die(
        new Error(
          'red-zone switch during a full queue (a 4th input): would need a 4th queue element — excluded from the MVP',
        ),
      )
    }

    const desiredAsset = desiredAssetFromSignal(
      pressedParamButtonId,
      incoming.asset,
    )
    yield* incoming.drop()
    return PatternPatternPatternTransitionState.make({
      playbackStartedAtSecond: oldest.playbackStartedAtSecond,
      transitionQueue: [
        oldest,
        middle,
        yield* oldest.scheduleNextPattern(desiredAsset),
      ],
    })
  }
}
