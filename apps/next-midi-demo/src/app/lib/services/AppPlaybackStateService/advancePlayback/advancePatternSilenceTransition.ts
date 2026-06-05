import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'

import { maxLoudness } from '../constants.ts'
import { getAudioBufferOfAsset } from '../getAudioBufferOfAsset.ts'
import {
  createLoopScheduledAfterSingleShot,
  createScheduledNextPlayback,
  scheduleFadeOutOf,
} from '../playbackNodes/index.ts'
import { calcTimingsMath } from '../timingMath.ts'
import {
  PatternTransitionElementWithScheduledCleanup,
  PatternTransitionQueueElement,
} from '../types/common.ts'
import { PatternPatternTransition } from '../types/PatternPatternTransition.ts'
import type { PatternSilenceTransition } from '../types/PatternSilenceTransition.ts'
import type { AdvancePlaybackDeps } from './deps.ts'
import type { Signal } from './signal.ts'

export const advancePatternSilenceTransition = Effect.fn(
  'advancePatternSilenceTransition',
)(function* (
  oldState: PatternSilenceTransition,
  signal: Signal,
  deps: AdvancePlaybackDeps,
) {
  const audioContext = yield* EAudioContext.EAudioContext

  const [current] = oldState.transitionQueue

  if (Option.isNone(asset.pattern)) return oldState

  const secondsSinceAudioContextInit =
    yield* EAudioContext.currentTime(audioContext)
  const math = calcTimingsMath(
    oldState.playbackStartedAtSecond,
    secondsSinceAudioContextInit,
  )
  const audioBuffer = yield* getAudioBufferOfAsset(asset)

  if (math.fitsIntoBufferOfClosestTransition) {
    // Cancel the scheduled silence and redirect current loop into a transition to new loop
    yield* Effect.sync(() => {
      current.playback.gainNode.gain.cancelScheduledValues(
        secondsSinceAudioContextInit,
      )
      current.playback.gainNode.gain.setValueAtTime(
        maxLoudness,
        secondsSinceAudioContextInit,
      )
    })

    yield* current.cleanupFiberToolkit.cancelCleanup
    yield* scheduleFadeOutOf(current.playback, math)
    return PatternPatternTransition.make({
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [
        PatternTransitionElementWithScheduledCleanup.make({
          ...current,
          cleanupFiberToolkit: yield* deps.makeCleanupFibers(
            math.secondsSinceNowUpUntilFadeoutEnds,
          ),
          fadeoutStartsAtSecond: math.playbackFadeoutStartsAt,
          fadeoutEndsAtSecond: math.playbackFadeoutEndsAt,
        }),
        PatternTransitionQueueElement.make({
          asset,
          playback: yield* createScheduledNextPlayback(
            audioContext,
            audioBuffer,
            math,
          ),
        }),
      ],
    })
  }

  // Fade already in progress — schedule new loop to start right after current ends
  return PatternPatternTransition.make({
    playbackStartedAtSecond: oldState.playbackStartedAtSecond,
    transitionQueue: [
      current,
      PatternTransitionQueueElement.make({
        asset,
        playback: yield* createLoopScheduledAfterSingleShot(
          audioContext,
          audioBuffer,
          current.fadeoutEndsAtSecond,
        ),
      }),
    ],
  })
})
