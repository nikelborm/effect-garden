import * as Effect from 'effect/Effect'

import { AccordData } from '../../../domain/Accord.ts'
import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import { LoopBoundPlayback } from '../types/LoopBoundPlayback.ts'
import { getAudioNow } from '../types/loopElements.ts'
import {
  type LoopFadingToSilenceState,
  SilenceBoundPlayback,
} from '../types/SilenceBoundPlayback.ts'
import type { Signal } from './signal.ts'

export const advancePatternSilenceTransition = Effect.fn(
  'advancePatternSilenceTransition',
)(function* (oldState: LoopFadingToSilenceState, signal: Signal) {
  const { accord, strength } = oldState
  const [current] = oldState.transitionQueue

  if (StrengthData.models(signal))
    return SilenceBoundPlayback.make({
      accord,
      strength: signal.strength,
      transitionQueue: [current],
    })

  if (AccordData.models(signal))
    return yield* Effect.dieMessage(
      'slow strum request during fade-to-silence: not yet handled (slow strums deferred)',
    )

  const now = yield* getAudioNow

  const isInGreenZone =
    now <= current.fadeoutStartsAtSecond - schedulingSafeBufferInSeconds

  if (signal.pattern === current.asset.pattern) {
    if (!isInGreenZone)
      return yield* Effect.dieMessage(
        're-press of the same pattern during active fade-out: not yet handled',
      )

    const revived = yield* current.cancelFadeoutAndRestore()
    return LoopBoundPlayback.make({
      playbackStartedAtSecond: revived.playbackStartedAtSecond,
      transitionQueue: [revived],
    })
  }

  const asset = TaggedPatternPointer.make({
    pattern: signal.pattern,
    accord,
    strength,
  })
  const incoming = yield* current.scheduleNextLoop(asset)

  return LoopBoundPlayback.make({
    playbackStartedAtSecond: current.playbackStartedAtSecond,
    transitionQueue:
      current._tag === 'LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop'
        ? [current, incoming]
        : [current, incoming],
  })
})
