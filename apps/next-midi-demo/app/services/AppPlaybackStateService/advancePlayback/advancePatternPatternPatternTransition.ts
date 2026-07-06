import * as Effect from 'effect/Effect'

import { AccordData } from '../../../domain/Accord.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import {
  type FullLoopState,
  LoopBoundPlayback,
} from '../types/LoopBoundPlayback.ts'
import { getAudioNow } from '../types/loopElements.ts'
import { SilenceBoundPlayback } from '../types/SilenceBoundPlayback.ts'
import { desiredAssetFromSignal } from './desiredAssetFromSignal.ts'
import type { Signal } from './signal.ts'

export const advancePatternPatternPatternTransition = Effect.fn(
  'advancePatternPatternPatternTransition',
)(function* (oldState: FullLoopState, signal: Signal) {
  const [oldest, middle, incoming] = oldState.transitionQueue

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
        // playbackStartedAtSecond: oldest.playbackStartedAtSecond,
        accord: incoming.asset.accord,
        strength: incoming.asset.strength,
        transitionQueue: [oldest, middle],
      })
    }
    yield* Effect.logError({ oldest, middle, incoming, signal })
    return yield* Effect.dieMessage(
      'red-zone deselect during a full queue (a 4th input): would need a 3rd fading-to-silence loop — excluded from the MVP',
    )
  }

  if (!isInGreenZone) {
    yield* Effect.logError({ oldest, middle, incoming, signal })
    return yield* Effect.dieMessage(
      'red-zone switch during a full queue (a 4th input): would need a 4th queue element — excluded from the MVP',
    )
  }

  const desiredAsset = desiredAssetFromSignal(signal, incoming.asset)
  yield* incoming.drop()
  return LoopBoundPlayback.make({
    playbackStartedAtSecond: oldest.playbackStartedAtSecond,
    transitionQueue: [
      oldest,
      middle,
      yield* oldest.scheduleNextLoop(desiredAsset),
    ],
  })
})
