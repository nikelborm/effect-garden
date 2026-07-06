import * as Effect from 'effect/Effect'

import {
  FullLoopQueue,
  type LoopBoundPlayback,
  LoopRolloverHandoverQueue,
  LoopSilenceHandoverQueue,
  PlayingLoopQueue,
  PlayingSlowStrumQueue,
  SlowStrumHandoverQueue,
} from '../types/LoopBoundPlayback.ts'
import { advancePatternPatternPatternTransition } from './advancePatternPatternPatternTransition.ts'
import { advancePatternPatternTransition } from './advancePatternPatternTransition.ts'
import { advancePatternSilencePatternTransition } from './advancePatternSilencePatternTransition.ts'
import { advancePlayingPattern } from './advancePlayingPattern.ts'
import { advancePlayingSlowStrum } from './advancePlayingSlowStrum.ts'
import { advanceSlowStrumPatternTransition } from './advanceSlowStrumPatternTransition.ts'
import { queueIs } from './queueIs.ts'
import type { Signal } from './signal.ts'

export const advanceLoopBound = Effect.fn('advanceLoopBound')(function* (
  oldState: LoopBoundPlayback,
  signal: Signal,
) {
  if (queueIs(PlayingLoopQueue)(oldState))
    return yield* advancePlayingPattern(oldState, signal)

  if (queueIs(LoopRolloverHandoverQueue)(oldState))
    return yield* advancePatternPatternTransition(oldState, signal)

  if (queueIs(LoopSilenceHandoverQueue)(oldState))
    return yield* advancePatternSilencePatternTransition(oldState, signal)

  if (queueIs(FullLoopQueue)(oldState))
    return yield* advancePatternPatternPatternTransition(oldState, signal)

  if (queueIs(PlayingSlowStrumQueue)(oldState))
    return yield* advancePlayingSlowStrum(oldState, signal)

  if (queueIs(SlowStrumHandoverQueue)(oldState))
    return yield* advanceSlowStrumPatternTransition(oldState, signal)

  // Every LoopBoundQueue member is handled above.
  return yield* Effect.dieMessage('advanceLoopBound: unreachable queue shape')
})
