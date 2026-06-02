import * as Effect from 'effect/Effect'

import { helpGarbageCollectionOfPlayback } from './playbackNodes/index.ts'
import type {
  AppPlaybackState,
  PatternSilenceTransition,
} from './types/index.ts'

export const getNewCleanedUpState = Effect.fn('getNewCleanedUpState')(
  function* (
    stateRightBeforeCleanup: AppPlaybackState,
  ): Effect.fn.Return<AppPlaybackState> {
    yield* Effect.logTrace('Playback cleanup')

    if (stateRightBeforeCleanup._tag === 'PatternPatternTransition') {
      const [old, target] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(old.playback)
      return {
        _tag: 'PlayingPattern' as const,
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond,
        transitionQueue: [target],
      }
    }

    if (stateRightBeforeCleanup._tag === 'PatternPatternPatternTransition') {
      const [oldest, middle, target] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(oldest.playback)
      return {
        _tag: 'PatternPatternTransition' as const,
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond,
        transitionQueue: [middle, target],
      }
    }

    if (stateRightBeforeCleanup._tag === 'SlowStrumPatternTransition') {
      const [slowStrum, loop] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(slowStrum.playback)
      return {
        _tag: 'PlayingPattern' as const,
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond +
          slowStrum.durationSeconds,
        transitionQueue: [loop],
      }
    }

    if (stateRightBeforeCleanup._tag === 'PatternSilenceTransition') {
      const [fading] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(fading.playback)
      return { _tag: 'Silence' as const }
    }

    if (stateRightBeforeCleanup._tag === 'PatternPatternSilenceTransition') {
      const [oldest, fading] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(oldest.playback)
      return {
        _tag: 'PatternSilenceTransition' as const,
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond,
        transitionQueue: [fading],
      } satisfies PatternSilenceTransition
    }

    return stateRightBeforeCleanup
  },
)
