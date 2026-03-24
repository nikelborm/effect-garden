import * as Effect from 'effect/Effect'

import { helpGarbageCollectionOfPlayback } from './playbackNodes/index.ts'
import type {
  AppPlaybackState,
  ScheduledLoopToSilenceTransition,
} from './types/index.ts'

export const getNewCleanedUpState = Effect.fn('getNewCleanedUpState')(
  function* (
    stateRightBeforeCleanup: AppPlaybackState,
  ): Effect.fn.Return<AppPlaybackState> {
    yield* Effect.logTrace('Playback cleanup')

    if (
      stateRightBeforeCleanup._tag === 'ScheduledLoopToAnotherLoopTransition'
    ) {
      const [old, target] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(old.playback)
      return {
        _tag: 'PlayingLoop' as const,
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond,
        transitionQueue: [target],
      }
    }

    if (
      stateRightBeforeCleanup._tag ===
      'InProgressLoopToAnotherLoopTransitionWithScheduledChangeToYetAnotherLoop'
    ) {
      const [oldest, middle, target] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(oldest.playback)
      return {
        _tag: 'ScheduledLoopToAnotherLoopTransition' as const,
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond,
        transitionQueue: [middle, target],
      }
    }

    if (stateRightBeforeCleanup._tag === 'ScheduledSlowStrumToLoopTransition') {
      const [slowStrum, loop] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(slowStrum.playback)
      return {
        _tag: 'PlayingLoop' as const,
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond +
          slowStrum.durationSeconds,
        transitionQueue: [loop],
      }
    }

    if (stateRightBeforeCleanup._tag === 'ScheduledLoopToSilenceTransition') {
      const [fading] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(fading.playback)
      return { _tag: 'NotPlaying' as const }
    }

    if (
      stateRightBeforeCleanup._tag ===
      'InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence'
    ) {
      const [oldest, fading] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(oldest.playback)
      return {
        _tag: 'ScheduledLoopToSilenceTransition' as const,
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond,
        transitionQueue: [fading],
      } satisfies ScheduledLoopToSilenceTransition
    }

    return stateRightBeforeCleanup
  },
)
