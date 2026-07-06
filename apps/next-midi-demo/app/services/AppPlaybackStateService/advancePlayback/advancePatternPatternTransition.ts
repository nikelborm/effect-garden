import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'

import { AccordData } from '../../../domain/Accord.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import {
  LoopBoundPlayback,
  type LoopRolloverHandoverState,
} from '../types/LoopBoundPlayback.ts'
import { getAudioNow } from '../types/loopElements.ts'
import { SilenceBoundPlayback } from '../types/SilenceBoundPlayback.ts'
import { desiredAssetFromSignal } from './desiredAssetFromSignal.ts'
import type { Signal } from './signal.ts'

export const advancePatternPatternTransition = Effect.fn(
  'advancePatternPatternTransition',
)(function* (oldState: LoopRolloverHandoverState, signal: Signal) {
  const [current, incoming] = oldState.transitionQueue

  if (
    (AccordData.models(signal) && signal.accord === incoming.asset.accord) ||
    (StrengthData.models(signal) && signal.strength === incoming.asset.strength)
  )
    return oldState

  const now = yield* getAudioNow

  const isInGreenZone =
    now <= incoming.fadeInStartsAtSecond - schedulingSafeBufferInSeconds

  if (PatternData.models(signal) && signal.pattern === incoming.asset.pattern) {
    if (isInGreenZone) {
      yield* incoming.drop()
      return SilenceBoundPlayback.make({
        accord: incoming.asset.accord,
        strength: incoming.asset.strength,
        transitionQueue: [current],
      })
    }

    return SilenceBoundPlayback.make({
      accord: incoming.asset.accord,
      strength: incoming.asset.strength,
      transitionQueue: [current, yield* incoming.promoteToFadingOut()],
    })
  }

  const desiredAsset = desiredAssetFromSignal(signal, incoming.asset)

  if (isInGreenZone && Equal.equals(desiredAsset, current.asset)) {
    const revived = yield* current.cancelFadeoutAndRestore()
    yield* incoming.drop()
    return LoopBoundPlayback.make({
      playbackStartedAtSecond: revived.playbackStartedAtSecond,
      transitionQueue: [revived],
    })
  }

  if (!isInGreenZone) {
    return LoopBoundPlayback.make({
      playbackStartedAtSecond: current.playbackStartedAtSecond,
      transitionQueue: [
        current,
        yield* incoming.promoteToFadingOut(),
        yield* current.scheduleNextLoop(desiredAsset),
      ],
    })
  }

  yield* incoming.drop()
  return LoopBoundPlayback.make({
    playbackStartedAtSecond: current.playbackStartedAtSecond,
    transitionQueue: [
      yield* current.reanchorFadeoutOnto(),
      yield* current.scheduleNextLoop(desiredAsset),
    ],
  })
})
