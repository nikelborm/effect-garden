import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import {
  FullLoopQueue,
  type LoopBoundPlayback,
  LoopRolloverHandoverQueue,
  LoopSilenceHandoverQueue,
  PlayingLoopQueue,
  PlayingSlowStrumQueue,
} from '../types/LoopBoundPlayback.ts'
import { advancePatternPatternPatternTransition } from './advancePatternPatternPatternTransition.ts'
import { advancePatternPatternTransition } from './advancePatternPatternTransition.ts'
import { advancePatternSilencePatternTransition } from './advancePatternSilencePatternTransition.ts'
import { advancePlayingPattern } from './advancePlayingPattern.ts'
import { advancePlayingSlowStrum } from './advancePlayingSlowStrum.ts'
import { advanceSlowStrumPatternTransition } from './advanceSlowStrumPatternTransition.ts'
import type { Signal } from './signal.ts'

// Destination is a sounding loop. Pattern-match the queue shape with `Schema.is`
// over each named tuple schema and hand the destructured elements to the small
// advancer that owns that scenario. The short- vs long-fade handover split lets
// the roll-over and the to-silence handovers keep their own advancers.
export const advanceLoopBound = Effect.fn('advanceLoopBound')(function* (
  oldState: LoopBoundPlayback,
  signal: Signal,
) {
  const q = oldState.transitionQueue
  if (Schema.is(PlayingLoopQueue)(q))
    return yield* advancePlayingPattern(q[0], signal)
  if (Schema.is(LoopRolloverHandoverQueue)(q))
    return yield* advancePatternPatternTransition(q[0], q[1], signal)
  if (Schema.is(LoopSilenceHandoverQueue)(q))
    return yield* advancePatternSilencePatternTransition(q[0], q[1], signal)
  if (Schema.is(FullLoopQueue)(q))
    return yield* advancePatternPatternPatternTransition(
      q[0],
      q[1],
      q[2],
      signal,
    )
  if (Schema.is(PlayingSlowStrumQueue)(q))
    return yield* advancePlayingSlowStrum(q[0], signal)
  // The only shape left is [SlowStrum, ScheduledPattern].
  return yield* advanceSlowStrumPatternTransition(q[0], q[1], signal)
})
