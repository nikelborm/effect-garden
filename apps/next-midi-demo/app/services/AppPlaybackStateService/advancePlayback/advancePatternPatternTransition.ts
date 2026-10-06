import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'

import { AccordData } from '../../../domain/Accord.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import { getAudioNow } from '../types/loopElements.ts'
import {
  PatternPatternPatternTransitionState,
  PatternPatternTransitionState,
  PatternState,
} from '../types/PatternBound/index.ts'
import {
  PatternPatternSilenceTransitionState,
  PatternSilenceTransitionState,
} from '../types/SilenceBound/index.ts'
import { desiredAssetFromSignal } from './desiredAssetFromSignal.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advancePatternPatternTransition = Effect.fn(
  'advancePatternPatternTransition',
)(function* (
  oldState: PatternPatternTransitionState,
  pressedParamButtonId: PressedParamButtonId,
) {
  const [current, incoming] = oldState.transitionQueue

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
})
