import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { AccordData } from '../../../.././domain/Accord.ts'
import { desiredAssetFromSignal } from '../../../.././domain/desiredAssetFromSignal.ts'
import { PatternData } from '../../../.././domain/Pattern.ts'
import type { PressedParamButtonId } from '../../../.././domain/PressedParamButtonId.ts'
import { StrengthData } from '../../../.././domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../.././constants.ts'
import type { AdvanceFnReturn } from '../../index.ts'
import { getAudioNow } from '../../loopElements.ts'
import { PatternPatternSilenceTransitionState } from '../../SilenceBound/PatternPatternSilenceTransition/State.ts'
import { PatternBoundStateBase } from '../Base/State.ts'
import { PatternPatternPatternTransitionQueue } from './Queue.ts'

export class PatternPatternPatternTransitionState extends PatternBoundStateBase.extend<PatternPatternPatternTransitionState>(
  'PatternPatternPatternTransitionState',
)({
  transitionQueue: PatternPatternPatternTransitionQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternPatternPatternTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }

  advance = Effect.fn('PatternPatternPatternTransitionState.advance')(
    { self: this },
    function* (pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
      const [oldest, middle, incoming] = this.transitionQueue

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
    },
  )
}
