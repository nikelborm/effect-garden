import * as Effect from 'effect/Effect'

import type { SlowStrumState } from '../types/SlowStrumBoundState.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

// A slow strum is sounding (queue = [strum]). Slow strums are the deferred
// "monster": an interrupting strum regrids the whole tick grid, which is unsolved.
// For now any input during a slow strum dies. The prior reference implementation
// (interrupt-and-restart / schedule-loop-after-strum) lives in git history and in
// the midi_scheduling_findings memory.
export const advanceSlowStrum = Effect.fn('advanceSlowStrum')(function* (
  oldState: SlowStrumState,
  pressedParamButtonId: PressedParamButtonId,
) {
  const [strum] = oldState.transitionQueue
  yield* Effect.logError({ strum, pressedParamButtonId })
  return yield* Effect.die(new Error('slow strums are deferred (SlowStrum)'))
})
