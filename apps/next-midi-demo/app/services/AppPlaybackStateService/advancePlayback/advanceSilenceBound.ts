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
import { queueIs } from './queueIs.ts'
import type { Signal } from './signal.ts'

export const advanceSilenceBound = Effect.fn('advanceSilenceBound')(function* (
  oldState: SilenceBoundPlayback,
  signal: Signal,
) {
  if (queueIs(PureSilenceQueue)(oldState))
    return yield* advanceSilence(oldState, signal)

  if (queueIs(LoopFadingToSilenceQueue)(oldState))
    return yield* advancePatternSilenceTransition(oldState, signal)

  if (queueIs(TwoLoopsFadingToSilenceQueue)(oldState))
    return yield* advancePatternPatternSilenceTransition(oldState, signal)

  return yield* Effect.dieMessage(
    'advanceSilenceBound: unreachable queue shape',
  )
})
