import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import {
  LoopFadingToSilenceQueue,
  PureSilenceQueue,
  type SilenceBoundPlayback,
} from '../types/SilenceBoundPlayback.ts'
import { advancePatternPatternSilenceTransition } from './advancePatternPatternSilenceTransition.ts'
import { advancePatternSilenceTransition } from './advancePatternSilenceTransition.ts'
import { advanceSilence } from './advanceSilence.ts'
import type { Signal } from './signal.ts'

// Destination is silence. Pattern-match the queue shape with `Schema.is` and
// delegate to the small advancer that owns it, threading the carried base
// accord+strength (which the fading elements don't hold once the selection
// diverges from them).
export const advanceSilenceBound = Effect.fn('advanceSilenceBound')(function* (
  oldState: SilenceBoundPlayback,
  signal: Signal,
) {
  const { accord, strength } = oldState
  const q = oldState.transitionQueue
  if (Schema.is(PureSilenceQueue)(q))
    return yield* advanceSilence(accord, strength, signal)
  if (Schema.is(LoopFadingToSilenceQueue)(q))
    return yield* advancePatternSilenceTransition(
      q[0],
      accord,
      strength,
      signal,
    )
  // The only shape left is [FadingOut, FadingOut].
  return yield* advancePatternPatternSilenceTransition(
    q[0],
    q[1],
    accord,
    strength,
    signal,
  )
})
