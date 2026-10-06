import * as Effect from 'effect/Effect'

import {
  type SlowStrumBoundState,
  SlowStrumPatternTransitionState,
  SlowStrumState,
} from '../types/SlowStrumBoundState/index.ts'
import { advanceSlowStrum } from './advanceSlowStrum.ts'
import { advanceSlowStrumPatternTransition } from './advanceSlowStrumPatternTransition.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advanceSlowStrumBound = Effect.fn('advanceSlowStrumBound')(
  function* (
    oldState: SlowStrumBoundState,
    pressedParamButtonId: PressedParamButtonId,
  ) {
    if (SlowStrumState.models(oldState))
      return yield* advanceSlowStrum(oldState, pressedParamButtonId)

    if (SlowStrumPatternTransitionState.models(oldState))
      return yield* advanceSlowStrumPatternTransition(
        oldState,
        pressedParamButtonId,
      )

    oldState satisfies never

    // Every PatternBoundState member is handled above.
    return yield* Effect.die(
      new Error('advancePatternBound: unreachable state shape'),
    )
  },
)
