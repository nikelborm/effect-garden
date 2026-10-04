import * as Effect from 'effect/Effect'

import {
  LoopFadingToSilenceState,
  PureSilenceState,
  type SilenceBoundPlayback,
  TwoLoopsFadingToSilenceState,
} from '../types/SilenceBoundPlayback.ts'
import { advancePatternPatternSilenceTransition } from './advancePatternPatternSilenceTransition.ts'
import { advancePatternSilenceTransition } from './advancePatternSilenceTransition.ts'
import { advanceSilence } from './advanceSilence.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advanceSilenceBound = Effect.fn('advanceSilenceBound')(function* (
  oldState: SilenceBoundPlayback,
  pressedParamButtonId: PressedParamButtonId,
) {
  if (PureSilenceState.models(oldState))
    return yield* advanceSilence(oldState, pressedParamButtonId)

  if (LoopFadingToSilenceState.models(oldState))
    return yield* advancePatternSilenceTransition(
      oldState,
      pressedParamButtonId,
    )

  if (TwoLoopsFadingToSilenceState.models(oldState))
    return yield* advancePatternPatternSilenceTransition(
      oldState,
      pressedParamButtonId,
    )

  oldState satisfies never

  return yield* Effect.die(
    new Error('advanceSilenceBound: unreachable state shape'),
  )
})
