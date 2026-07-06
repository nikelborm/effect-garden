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

export const getNewCleanedUpState = Effect.fn('getNewCleanedUpState')(
  function* (
    state: AppPlaybackState,
  ): Effect.fn.Return<AppPlaybackState, never, DisposePlayback> {
    yield* Effect.logTrace('Playback cleanup')

    if (state._tag === 'SilenceBoundPlayback') {
      const q = state.transitionQueue

      if (Schema.is(TwoLoopsFadingToSilenceQueue)(q)) {
        yield* q[0].dispose()
        return SilenceBoundPlayback.make({
          accord: state.accord,
          strength: state.strength,

          transitionQueue: [q[1]],
        })
      }

      if (Schema.is(LoopFadingToSilenceQueue)(q)) {
        yield* q[0].dispose()
        return SilenceBoundPlayback.make({
          accord: state.accord,
          strength: state.strength,
          transitionQueue: [],
        })
      }

      return state
    }

    const q = state.transitionQueue

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

    return state
  },
)
