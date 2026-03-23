import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'

import type { CurrentSelectedAsset } from '../../CurrentlySelectedAssetState.ts'
import {
  createLoopScheduledAfterSlowStrum,
  createScheduledNextPlayback,
  scheduleFadeOutOf,
} from '../playbackNodes/index.ts'
import { calcTimingsMath } from '../timingMath.ts'
import type {
  ScheduledLoopToAnotherLoopTransition,
  ScheduledLoopToSilenceTransition,
} from '../types.ts'
import { maxLoudness } from '../constants.ts'
import type { ReschedulePlaybackDeps } from './deps.ts'

export const fromScheduledLoopToSilenceTransition = Effect.fn(
  'fromScheduledLoopToSilenceTransition',
)(function* (
  oldState: ScheduledLoopToSilenceTransition,
  asset: CurrentSelectedAsset,
  deps: ReschedulePlaybackDeps,
) {
  const [current] = oldState.transitionQueue

  if (Option.isNone(asset.pattern)) return oldState

  const secondsSinceAudioContextInit = yield* EAudioContext.currentTime(
    deps.audioContext,
  )
  const math = calcTimingsMath(
    oldState.playbackStartedAtSecond,
    secondsSinceAudioContextInit,
  )
  const audioBuffer = yield* deps.getAudioBufferOfAsset(asset)

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
      _tag: 'ScheduledLoopToAnotherLoopTransition' as const,
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
            deps.audioContext,
            audioBuffer,
            math,
          ),
        },
      ],
    } satisfies ScheduledLoopToAnotherLoopTransition
  }

  // Fade already in progress — schedule new loop to start right after current ends
  return {
    _tag: 'ScheduledLoopToAnotherLoopTransition' as const,
    playbackStartedAtSecond: oldState.playbackStartedAtSecond,
    transitionQueue: [
      current,
      {
        asset,
        playback: yield* createLoopScheduledAfterSlowStrum(
          deps.audioContext,
          audioBuffer,
          current.fadeoutEndsAtSecond,
        ),
      },
    ],
  } satisfies ScheduledLoopToAnotherLoopTransition
})
