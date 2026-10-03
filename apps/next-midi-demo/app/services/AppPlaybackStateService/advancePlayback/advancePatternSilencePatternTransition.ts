import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'

import { AccordData } from '../../../domain/Accord.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import {
  LoopBoundPlayback,
  type LoopSilenceHandoverState,
} from '../types/LoopBoundPlayback.ts'
import { getAudioNow } from '../types/loopElements.ts'
import { SilenceBoundPlayback } from '../types/SilenceBoundPlayback.ts'
import { desiredAssetFromSignal } from './desiredAssetFromSignal.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advancePatternSilencePatternTransition = Effect.fn(
  'advancePatternSilencePatternTransition',
)(function* (
  oldState: LoopSilenceHandoverState,
  pressedParamButtonId: PressedParamButtonId,
) {
  const [dying, incoming] = oldState.transitionQueue

  if (
    (AccordData.models(pressedParamButtonId) &&
      pressedParamButtonId.accord === incoming.asset.accord) ||
    (StrengthData.models(pressedParamButtonId) &&
      pressedParamButtonId.strength === incoming.asset.strength)
  )
    return oldState

  const now = yield* getAudioNow

  const isInGreenZone =
    now <= incoming.fadeInStartsAtSecond - schedulingSafeBufferInSeconds

  if (
    PatternData.models(pressedParamButtonId) &&
    pressedParamButtonId.pattern === incoming.asset.pattern
  ) {
    if (isInGreenZone) {
      yield* incoming.drop()
      return SilenceBoundPlayback.make({
        accord: incoming.asset.accord,
        strength: incoming.asset.strength,
        transitionQueue: [dying],
      })
    }

    return SilenceBoundPlayback.make({
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
    return LoopBoundPlayback.make({
      playbackStartedAtSecond: revived.playbackStartedAtSecond,
      transitionQueue: [revived],
    })
  }

  if (!isInGreenZone) {
    return LoopBoundPlayback.make({
      playbackStartedAtSecond: dying.playbackStartedAtSecond,
      transitionQueue: [
        dying,
        yield* incoming.promoteToFadingOut(),
        yield* dying.scheduleNextLoop(desiredAsset),
      ],
    })
  }

  yield* incoming.drop()
  return LoopBoundPlayback.make({
    playbackStartedAtSecond: dying.playbackStartedAtSecond,
    transitionQueue: [dying, yield* dying.scheduleNextLoop(desiredAsset)],
  })
})
