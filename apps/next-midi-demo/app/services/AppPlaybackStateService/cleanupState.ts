import * as Effect from 'effect/Effect'

import { helpGarbageCollectionOfPlayback } from './playbackNodes/index.ts'
import type { AppPlaybackState } from './types/index.ts'
import { PatternPatternTransition } from './types/PatternPatternTransition.ts'
import { PatternSilenceTransition } from './types/PatternSilenceTransition.ts'
import { PlayingPattern } from './types/PlayingPattern.ts'
import { Silence } from './types/Silence.ts'

// Collapse whatever state is CURRENT by exactly one level when a cleanup fiber
// fires, GC-ing the OLDEST queue element. Each element owns its own disposal /
// reclassification (`.dispose()` / `.becomeLive()`), so element construction has
// a single home and this only decides the queue-shape collapse.
export const getNewCleanedUpState = Effect.fn('getNewCleanedUpState')(
  function* (
    stateRightBeforeCleanup: AppPlaybackState,
  ): Effect.fn.Return<AppPlaybackState> {
    yield* Effect.logTrace('Playback cleanup')

    if (stateRightBeforeCleanup._tag === 'PatternPatternTransition') {
      const [old, target] = stateRightBeforeCleanup.transitionQueue
      yield* old.dispose()
      const live = target.becomeLive()
      return PlayingPattern.make({
        playbackStartedAtSecond: live.playbackStartedAtSecond,
        asset: live.asset,
        playback: live.playback,
      })
    }

    if (stateRightBeforeCleanup._tag === 'PatternSilencePatternTransition') {
      const [dying, target] = stateRightBeforeCleanup.transitionQueue
      yield* dying.dispose()
      const live = target.becomeLive()
      return PlayingPattern.make({
        playbackStartedAtSecond: live.playbackStartedAtSecond,
        asset: live.asset,
        playback: live.playback,
      })
    }

    if (stateRightBeforeCleanup._tag === 'PatternPatternPatternTransition') {
      const [oldest, middle, target] = stateRightBeforeCleanup.transitionQueue
      yield* oldest.dispose()
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
      yield* fading.dispose()
      return Silence.make({
        accord: stateRightBeforeCleanup.accord,
        strength: stateRightBeforeCleanup.strength,
      })
    }

    if (stateRightBeforeCleanup._tag === 'PatternPatternSilenceTransition') {
      const [oldest, fading] = stateRightBeforeCleanup.transitionQueue
      yield* oldest.dispose()
      return PatternSilenceTransition.make({
        playbackStartedAtSecond:
          stateRightBeforeCleanup.playbackStartedAtSecond,
        accord: stateRightBeforeCleanup.accord,
        strength: stateRightBeforeCleanup.strength,
        transitionQueue: [fading],
      })
    }

    return stateRightBeforeCleanup
  },
)
