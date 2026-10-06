import * as Effect from 'effect/Effect'

import {
  PatternPatternSilenceTransitionState,
  PatternSilenceTransitionState,
  type SilenceBoundState,
  SilenceState,
} from '../types/SilenceBound/index.ts'
import { advancePatternPatternSilenceTransition } from './advancePatternPatternSilenceTransition.ts'
import { advancePatternSilenceTransition } from './advancePatternSilenceTransition.ts'
import { advanceSilence } from './advanceSilence.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advanceSilenceBound = Effect.fn('advanceSilenceBound')(function* (
  oldState: SilenceBoundState,
  pressedParamButtonId: PressedParamButtonId,
) {
  if (SilenceState.models(oldState))
    return yield* advanceSilence(oldState, pressedParamButtonId)

  if (PatternSilenceTransitionState.models(oldState))
    return yield* advancePatternSilenceTransition(
      oldState,
      pressedParamButtonId,
    )

  if (PatternPatternSilenceTransitionState.models(oldState))
    return yield* advancePatternPatternSilenceTransition(
      oldState,
      pressedParamButtonId,
    )

  oldState satisfies never

  return yield* Effect.die(
    new Error('advanceSilenceBound: unreachable state shape'),
  )
})
