import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { AppPlaybackState } from './types/index.ts'
import {
  FullLoopQueue,
  LoopBoundPlayback,
  LoopRolloverHandoverQueue,
  LoopSilenceHandoverQueue,
} from './types/LoopBoundPlayback.ts'
import {
  LoopFadingToSilenceQueue,
  SilenceBoundPlayback,
  TwoLoopsFadingToSilenceQueue,
} from './types/SilenceBoundPlayback.ts'
import type { DisposePlayback } from './webAudioSideEffects/index.ts'

// Collapse whatever state is CURRENT by exactly one level when a cleanup fiber
// fires, GC-ing the OLDEST queue element. Each element owns its own disposal /
// reclassification (`.dispose()` / `.becomeLive()`), so element construction has
// a single home and this only decides the queue-shape collapse. The collapse is
// purely positional (always the oldest = queue[0]), so multi-fiber states drop
// correctly regardless of which fiber fires first; `.dispose()` is the only
// side effect here, requiring DisposePlayback from context.
export const getNewCleanedUpState = Effect.fn('getNewCleanedUpState')(
  function* (
    state: AppPlaybackState,
  ): Effect.fn.Return<AppPlaybackState, never, DisposePlayback> {
    yield* Effect.logTrace('Playback cleanup')

    if (state._tag === 'SilenceBoundPlayback') {
      const q = state.transitionQueue
      // [FadingOut, FadingOut] -> [FadingOut]: the oldest stop-fade finished.
      if (Schema.is(TwoLoopsFadingToSilenceQueue)(q)) {
        yield* q[0].dispose()
        return SilenceBoundPlayback.make({
          accord: state.accord,
          strength: state.strength,
          playbackStartedAtSecond: state.playbackStartedAtSecond,
          transitionQueue: [q[1]],
        })
      }
      // [FadingOut] -> []: the last loop finished; we are now pure silence with no
      // playing grid, so playbackStartedAtSecond drops away.
      if (Schema.is(LoopFadingToSilenceQueue)(q)) {
        yield* q[0].dispose()
        return SilenceBoundPlayback.make({
          accord: state.accord,
          strength: state.strength,
          transitionQueue: [],
        })
      }
      // [] pure silence: no fiber to have fired.
      return state
    }

    const q = state.transitionQueue
    // [FadingOut, FadingOut, Incoming] -> [FadingOut, Incoming]: oldest gone. The
    // ternary only narrows the surviving fade's type onto the right handover
    // union member (roll-over vs to-silence).
    if (Schema.is(FullLoopQueue)(q)) {
      const [, middle, incoming] = q
      yield* q[0].dispose()
      return LoopBoundPlayback.make({
        playbackStartedAtSecond: state.playbackStartedAtSecond,
        transitionQueue:
          middle._tag ===
          'LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop'
            ? [middle, incoming]
            : [middle, incoming],
      })
    }
    // [FadingOut, Incoming] -> [Playing]: the outgoing loop is gone and the
    // incoming one is now the live loop.
    if (
      Schema.is(LoopRolloverHandoverQueue)(q) ||
      Schema.is(LoopSilenceHandoverQueue)(q)
    ) {
      yield* q[0].dispose()
      return LoopBoundPlayback.make({
        playbackStartedAtSecond: state.playbackStartedAtSecond,
        transitionQueue: [q[1].becomeLive()],
      })
    }
    // [Playing], [PlayingSlowStrum], [SlowStrum, ScheduledPattern]: terminal /
    // deferred shapes with no cleanup fiber to fire.
    return state
  },
)
