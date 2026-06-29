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

// Destination is silence. Pattern-match the queue shape with `queueIs` and
// delegate the WHOLE oldState (narrowed to that one scenario) to the small
// advancer that owns it — each reads the carried base accord+strength straight
// off oldState (the fading elements don't hold it once the selection diverges).
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
  // Every SilenceBoundQueue member is handled above.
  return yield* Effect.dieMessage(
    'advanceSilenceBound: unreachable queue shape',
  )
})
