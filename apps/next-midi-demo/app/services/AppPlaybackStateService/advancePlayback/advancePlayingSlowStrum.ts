import * as Effect from 'effect/Effect'

import type { PlayingSlowStrum } from '../types/PlayingSlowStrum.ts'
import type { Signal } from './signal.ts'

// A slow strum is sounding (queue = [strum]). Slow strums are the deferred
// "monster": an interrupting strum regrids the whole tick grid, which is unsolved.
// For now any input during a slow strum dies. The prior reference implementation
// (interrupt-and-restart / schedule-loop-after-strum) lives in git history and in
// the midi_scheduling_findings memory.
export const advancePlayingSlowStrum = Effect.fn('advancePlayingSlowStrum')(
  function* (strum: PlayingSlowStrum, signal: Signal) {
    yield* Effect.logError({ strum, signal })
    return yield* Effect.dieMessage(
      'slow strums are deferred (PlayingSlowStrum)',
    )
  },
)
