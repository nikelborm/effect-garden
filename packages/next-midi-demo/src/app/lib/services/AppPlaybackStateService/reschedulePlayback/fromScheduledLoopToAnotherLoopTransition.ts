import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Option from 'effect/Option'
import * as Struct from 'effect/Struct'

import type { CurrentSelectedAsset } from '../../CurrentlySelectedAssetState.ts'
import { maxLoudness } from '../constants.ts'
import {
  createScheduledNextPlayback,
  helpGarbageCollectionOfPlayback,
  scheduleFadeOutOf,
} from '../playbackNodes/index.ts'
import { calcTimingsMath } from '../timingMath.ts'
import type {
  InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence,
  InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToYetAnotherLoop,
  PlayingLoop,
  ScheduledLoopToAnotherLoopTransition,
  ScheduledLoopToSilenceTransition,
} from '../types/index.ts'
import type { ReschedulePlaybackDeps } from './deps.ts'

export const fromScheduledLoopToAnotherLoopTransition = Effect.fn(
  'fromScheduledLoopToAnotherLoopTransition',
)(function* (
  oldState: ScheduledLoopToAnotherLoopTransition,
  asset: CurrentSelectedAsset,
  deps: ReschedulePlaybackDeps,
) {
  const current = oldState.transitionQueue[0]
  const latest = oldState.transitionQueue[1]

  if (Equal.equals(latest.asset, asset)) return oldState

  const secondsSinceAudioContextInit = yield* EAudioContext.currentTime(
    deps.audioContext,
  )

  const math = calcTimingsMath(
    oldState.playbackStartedAtSecond,
    secondsSinceAudioContextInit,
  )

  if (Option.isNone(asset.pattern)) {
    if (math.fitsIntoBufferOfClosestTransition) {
      // Pattern deselected before transition — cancel latest, keep current fading to silence
      yield* helpGarbageCollectionOfPlayback(latest.playback)
      return {
        _tag: 'ScheduledLoopToSilenceTransition' as const,
        playbackStartedAtSecond: oldState.playbackStartedAtSecond,
        transitionQueue: [current],
      } satisfies ScheduledLoopToSilenceTransition
    }
    // Transition already in progress — latest is fading in; schedule its fade-out too
    yield* scheduleFadeOutOf(latest.playback, math)
    return {
      _tag: 'InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence' as const,
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [
        current,
        {
          ...latest,
          cleanupFiberToolkit: yield* deps.makeCleanupFibers(
            math.secondsSinceNowUpUntilFadeoutEnds,
          ),
          fadeoutStartsAtSecond: math.playbackFadeoutStartsAt,
          fadeoutEndsAtSecond: math.playbackFadeoutEndsAt,
        },
      ],
    } satisfies InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence
  }

  if (
    math.fitsIntoBufferOfClosestTransition &&
    Equal.equals(current.asset, asset)
  ) {
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
    yield* helpGarbageCollectionOfPlayback(latest.playback)
    return {
      _tag: 'PlayingLoop',
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [Struct.pick(current, 'asset', 'playback')],
    } satisfies PlayingLoop
  }

  const audioBuffer = yield* deps.getAudioBufferOfAsset(asset)
  const playback = yield* createScheduledNextPlayback(
    deps.audioContext,
    audioBuffer,
    math,
  )

  if (!math.fitsIntoBufferOfClosestTransition) {
    yield* scheduleFadeOutOf(latest.playback, math)
    return {
      _tag: 'InProgressLoopToAnotherLoopTransitionWithScheduledChangeToYetAnotherLoop' as const,
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [
        current,
        {
          ...latest,
          fadeoutStartsAtSecond: math.playbackFadeoutStartsAt,
          fadeoutEndsAtSecond: math.playbackFadeoutEndsAt,
          cleanupFiberToolkit: yield* deps.makeCleanupFibers(
            math.secondsSinceNowUpUntilFadeoutEnds,
          ),
        },
        { asset, playback },
      ],
    } satisfies InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToYetAnotherLoop
  }

  return {
    _tag: 'ScheduledLoopToAnotherLoopTransition' as const,
    playbackStartedAtSecond: oldState.playbackStartedAtSecond,
    transitionQueue: [current, { asset, playback }],
  } satisfies ScheduledLoopToAnotherLoopTransition
})
