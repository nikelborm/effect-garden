import * as Effect from 'effect/Effect'

import { helpGarbageCollectionOfPlayback } from './playbackNodes/index.ts'
import type {
  AppPlaybackState,
  ScheduledLoopSilenceTransition,
} from './types/index.ts'

export const getNewCleanedUpState = Effect.fn('getNewCleanedUpState')(
  function* (
    stateRightBeforeCleanup: AppPlaybackState,
  ): Effect.fn.Return<AppPlaybackState> {
    yield* Effect.logTrace('Playback cleanup')

    if (stateRightBeforeCleanup._tag === 'ScheduledLoopLoopTransition') {
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
      'InProgressLoopLoopTransitionWithScheduledChangeToYetLoop'
    ) {
      const [oldest, middle, target] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(oldest.playback)
      return {
        _tag: 'ScheduledLoopLoopTransition' as const,
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond,
        transitionQueue: [middle, target],
      }
    }

    if (stateRightBeforeCleanup._tag === 'ScheduledSlowStrumLoopTransition') {
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

    if (stateRightBeforeCleanup._tag === 'ScheduledLoopSilenceTransition') {
      const [fading] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(fading.playback)
      return { _tag: 'NotPlaying' as const }
    }

    if (
      stateRightBeforeCleanup._tag ===
      'InProgressLoopLoopTransitionWithScheduledTransitionSilence'
    ) {
      const [oldest, fading] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(oldest.playback)
      return {
        _tag: 'ScheduledLoopSilenceTransition' as const,
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond,
        transitionQueue: [fading],
      } satisfies ScheduledLoopSilenceTransition
    }

    return stateRightBeforeCleanup
  },
)
