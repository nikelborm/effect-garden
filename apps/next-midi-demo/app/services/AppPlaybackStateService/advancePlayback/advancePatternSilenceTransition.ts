import * as Effect from 'effect/Effect'

import { AccordData } from '../../../domain/Accord.ts'
import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import { getAudioNow } from '../types/loopElements.ts'
import {
  PatternPatternTransitionState,
  PatternSilencePatternTransitionState,
  PatternState,
} from '../types/PatternBoundState/index.ts'
import { PatternSilenceTransitionState } from '../types/SilenceBoundState/index.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advancePatternSilenceTransition = Effect.fn(
  'advancePatternSilenceTransition',
)(function* (
  oldState: PatternSilenceTransitionState,
  pressedParamButtonId: PressedParamButtonId,
) {
  const { accord, strength } = oldState
  const [current] = oldState.transitionQueue

  if (StrengthData.models(pressedParamButtonId))
    return PatternSilenceTransitionState.make({
      accord,
      strength: pressedParamButtonId.strength,
      transitionQueue: [current],
    })

  if (AccordData.models(pressedParamButtonId))
    return yield* Effect.die(
      new Error(
        'slow strum request during fade-to-silence: not yet handled (slow strums deferred)',
      ),
    )

  const now = yield* getAudioNow

  const isInGreenZone =
    now <= current.fadeoutStartsAtSecond - schedulingSafeBufferInSeconds

  if (pressedParamButtonId.pattern === current.asset.pattern) {
    if (!isInGreenZone)
      return yield* Effect.die(
        new Error(
          're-press of the same pattern during active fade-out: not yet handled',
        ),
      )

    const revived = yield* current.cancelFadeoutAndRestore()
    return PatternState.make({
      playbackStartedAtSecond: revived.playbackStartedAtSecond,
      transitionQueue: [revived],
    })
  }

  const asset = TaggedPatternPointer.make({
    pattern: pressedParamButtonId.pattern,
    accord,
    strength,
  })
  const incoming = yield* current.scheduleNextPattern(asset)

  if (
    current._tag ===
    'PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern'
  )
    return PatternPatternTransitionState.make({
      playbackStartedAtSecond: current.playbackStartedAtSecond,
      transitionQueue: [current, incoming],
    })

  return PatternSilencePatternTransitionState.make({
    playbackStartedAtSecond: current.playbackStartedAtSecond,
    transitionQueue: [current, incoming],
  })
})
