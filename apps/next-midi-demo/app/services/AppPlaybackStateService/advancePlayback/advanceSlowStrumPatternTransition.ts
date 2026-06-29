import * as Effect from 'effect/Effect'

import type { SlowStrumHandoverState } from '../types/LoopBoundPlayback.ts'
import type { Signal } from './signal.ts'

// A slow strum handing over to a loop (queue = [strum, scheduledPattern]). Like
// advancePlayingSlowStrum this is part of the deferred slow-strum problem; any
// input dies for now. Reference implementation: git history + the
// midi_scheduling_findings memory.
export const advanceSlowStrumPatternTransition = Effect.fn(
  'advanceSlowStrumPatternTransition',
)(function* (oldState: SlowStrumHandoverState, signal: Signal) {
  const [strum, scheduled] = oldState.transitionQueue
  yield* Effect.logError({ strum, scheduled, signal })
  return yield* Effect.dieMessage('slow strums are deferred (SlowStrumPattern)')
})
