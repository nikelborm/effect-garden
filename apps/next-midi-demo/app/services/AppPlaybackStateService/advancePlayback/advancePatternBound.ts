import * as Effect from 'effect/Effect'

import {
  type PatternBoundState,
  PatternPatternPatternTransitionState,
  PatternPatternTransitionState,
  PatternSilencePatternTransitionState,
  PatternState,
} from '../types/PatternBoundState/index.ts'
import { advancePattern } from './advancePattern.ts'
import { advancePatternPatternPatternTransition } from './advancePatternPatternPatternTransition.ts'
import { advancePatternPatternTransition } from './advancePatternPatternTransition.ts'
import { advancePatternSilencePatternTransition } from './advancePatternSilencePatternTransition.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advancePatternBound = Effect.fn('advancePatternBound')(function* (
  oldState: PatternBoundState,
  pressedParamButtonId: PressedParamButtonId,
) {
  if (PatternState.models(oldState))
    return yield* advancePattern(oldState, pressedParamButtonId)

  if (PatternPatternTransitionState.models(oldState))
    return yield* advancePatternPatternTransition(
      oldState,
      pressedParamButtonId,
    )

  if (PatternSilencePatternTransitionState.models(oldState))
    return yield* advancePatternSilencePatternTransition(
      oldState,
      pressedParamButtonId,
    )

  if (PatternPatternPatternTransitionState.models(oldState))
    return yield* advancePatternPatternPatternTransition(
      oldState,
      pressedParamButtonId,
    )

  oldState satisfies never

  // Every PatternBoundState member is handled above.
  return yield* Effect.die(
    new Error('advancePatternBound: unreachable state shape'),
  )
})
