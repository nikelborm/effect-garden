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
import type {
  PatternPatternTransition,
  PatternSilenceTransition,
} from '../types/index.ts'
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
    return {
      _tag: 'PatternPatternTransition' as const,
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [
        {
          ...current,
          cleanupFiberToolkit: yield* deps.makeCleanupFibers(
            math.secondsSinceNowUpUntilFadeoutEnds,
          ),
          fadeoutStartsAtSecond: math.playbackFadeoutStartsAt,
          fadeoutEndsAtSecond: math.playbackFadeoutEndsAt,
        },
        {
          asset,
          playback: yield* createScheduledNextPlayback(
            audioContext,
            audioBuffer,
            math,
          ),
        },
      ],
    } satisfies PatternPatternTransition
  }

  // Fade already in progress — schedule new loop to start right after current ends
  return {
    _tag: 'PatternPatternTransition' as const,
    playbackStartedAtSecond: oldState.playbackStartedAtSecond,
    transitionQueue: [
      current,
      {
        asset,
        playback: yield* createLoopScheduledAfterSingleShot(
          audioContext,
          audioBuffer,
          current.fadeoutEndsAtSecond,
        ),
      },
    ],
  } satisfies PatternPatternTransition
})
