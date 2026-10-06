import * as Effect from 'effect/Effect'

import type { SlowStrumPatternTransitionState } from '../types/SlowStrumBound/index.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

// A slow strum handing over to a loop (queue = [strum, scheduledPattern]). Like
// advanceSlowStrum this is part of the deferred slow-strum problem; any
// input dies for now. Reference implementation: git history + the
// midi_scheduling_findings memory.
export const advanceSlowStrumPatternTransition = Effect.fn(
  'advanceSlowStrumPatternTransition',
)(function* (
  oldState: SlowStrumPatternTransitionState,
  pressedParamButtonId: PressedParamButtonId,
) {
  const [strum, scheduled] = oldState.transitionQueue
  yield* Effect.logError({ strum, scheduled, pressedParamButtonId })
  return yield* Effect.die(
    new Error('slow strums are deferred (SlowStrumPattern)'),
  )
})
