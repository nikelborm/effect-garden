import * as Effect from 'effect/Effect'

import { helpGarbageCollectionOfPlayback } from './playbackNodes/index.ts'
import type { AppPlaybackState } from './types/index.ts'
import { PatternPatternTransition } from './types/PatternPatternTransition.ts'
import { PatternSilenceTransition } from './types/PatternSilenceTransition.ts'
import { PlayingPattern } from './types/PlayingPattern.ts'
import { Silence } from './types/Silence.ts'

export const getNewCleanedUpState = Effect.fn('getNewCleanedUpState')(
  function* (
    stateRightBeforeCleanup: AppPlaybackState,
  ): Effect.fn.Return<AppPlaybackState> {
    yield* Effect.logTrace('Playback cleanup')

    if (stateRightBeforeCleanup._tag === 'PatternPatternTransition') {
      const [old, target] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(old.playback)
      return PlayingPattern.make({
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond,
        ...target,
      })
    }

    if (stateRightBeforeCleanup._tag === 'PatternPatternPatternTransition') {
      const [oldest, middle, target] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(oldest.playback)
      return PatternPatternTransition.make({
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond,
        transitionQueue: [middle, target],
      })
    }

    if (stateRightBeforeCleanup._tag === 'SlowStrumPatternTransition') {
      const [slowStrum, loop] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(slowStrum.playback)
      return PlayingPattern.make({
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond +
          slowStrum.durationSeconds,
        ...loop,
      })
    }

    if (stateRightBeforeCleanup._tag === 'PatternSilenceTransition') {
      const [fading] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(fading.playback)
      return Silence.make()
    }

    if (stateRightBeforeCleanup._tag === 'PatternPatternSilenceTransition') {
      const [oldest, fading] = stateRightBeforeCleanup.transitionQueue
      yield* helpGarbageCollectionOfPlayback(oldest.playback)
      return PatternSilenceTransition.make({
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond,
        transitionQueue: [fading],
      })
    }

    return stateRightBeforeCleanup
  },
)
