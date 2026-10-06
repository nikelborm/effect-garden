import * as Effect from 'effect/Effect'

import { PatternPatternSilenceTransitionState } from '../types/SilenceBound/PatternPatternSilenceTransition/State.ts'
import { PatternSilenceTransitionState } from '../types/SilenceBound/PatternSilenceTransition/State.ts'
import { SilenceState } from '../types/SilenceBound/Silence/State.ts'
import type { SilenceBoundState } from '../types/SilenceBound/State.ts'
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
