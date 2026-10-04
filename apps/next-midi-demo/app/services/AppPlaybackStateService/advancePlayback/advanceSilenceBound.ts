import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

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
  if (Schema.is(PureSilenceState)(oldState))
    return yield* advanceSilence(oldState, pressedParamButtonId)

  if (Schema.is(LoopFadingToSilenceState)(oldState))
    return yield* advancePatternSilenceTransition(
      oldState,
      pressedParamButtonId,
    )

  if (Schema.is(TwoLoopsFadingToSilenceState)(oldState))
    return yield* advancePatternPatternSilenceTransition(
      oldState,
      pressedParamButtonId,
    )

  return yield* Effect.die(
    new Error('advanceSilenceBound: unreachable queue shape'),
  )
})
