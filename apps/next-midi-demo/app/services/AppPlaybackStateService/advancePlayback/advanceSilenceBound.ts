import * as Effect from 'effect/Effect'

import {
  LoopFadingToSilenceQueue,
  PureSilenceQueue,
  type SilenceBoundPlayback,
  TwoLoopsFadingToSilenceQueue,
} from '../types/SilenceBoundPlayback.ts'
import { advancePatternPatternSilenceTransition } from './advancePatternPatternSilenceTransition.ts'
import { advancePatternSilenceTransition } from './advancePatternSilenceTransition.ts'
import { advanceSilence } from './advanceSilence.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'
import { queueIs } from './queueIs.ts'

export const advanceSilenceBound = Effect.fn('advanceSilenceBound')(function* (
  oldState: SilenceBoundPlayback,
  pressedParamButtonId: PressedParamButtonId,
) {
  if (queueIs(PureSilenceQueue)(oldState))
    return yield* advanceSilence(oldState, pressedParamButtonId)

  if (queueIs(LoopFadingToSilenceQueue)(oldState))
    return yield* advancePatternSilenceTransition(
      oldState,
      pressedParamButtonId,
    )

  if (queueIs(TwoLoopsFadingToSilenceQueue)(oldState))
    return yield* advancePatternPatternSilenceTransition(
      oldState,
      pressedParamButtonId,
    )

  return yield* Effect.die(
    new Error('advanceSilenceBound: unreachable queue shape'),
  )
})
