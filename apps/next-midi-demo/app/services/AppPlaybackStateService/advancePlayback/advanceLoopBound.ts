import * as Effect from 'effect/Effect'

import {
  FullLoopQueue,
  type LoopBoundPlayback,
  LoopRolloverHandoverQueue,
  LoopSilenceHandoverQueue,
  PlayingLoopQueue,
  PlayingSlowStrumQueue,
  SlowStrumHandoverQueue,
} from '../types/LoopBoundPlayback.ts'
import { advancePatternPatternPatternTransition } from './advancePatternPatternPatternTransition.ts'
import { advancePatternPatternTransition } from './advancePatternPatternTransition.ts'
import { advancePatternSilencePatternTransition } from './advancePatternSilencePatternTransition.ts'
import { advancePlayingPattern } from './advancePlayingPattern.ts'
import { advancePlayingSlowStrum } from './advancePlayingSlowStrum.ts'
import { advanceSlowStrumPatternTransition } from './advanceSlowStrumPatternTransition.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'
import { queueIs } from './queueIs.ts'

export const advanceLoopBound = Effect.fn('advanceLoopBound')(function* (
  oldState: LoopBoundPlayback,
  pressedParamButtonId: PressedParamButtonId,
) {
  if (queueIs(PlayingLoopQueue)(oldState))
    return yield* advancePlayingPattern(oldState, pressedParamButtonId)

  if (queueIs(LoopRolloverHandoverQueue)(oldState))
    return yield* advancePatternPatternTransition(
      oldState,
      pressedParamButtonId,
    )

  if (queueIs(LoopSilenceHandoverQueue)(oldState))
    return yield* advancePatternSilencePatternTransition(
      oldState,
      pressedParamButtonId,
    )

  if (queueIs(FullLoopQueue)(oldState))
    return yield* advancePatternPatternPatternTransition(
      oldState,
      pressedParamButtonId,
    )

  if (queueIs(PlayingSlowStrumQueue)(oldState))
    return yield* advancePlayingSlowStrum(oldState, pressedParamButtonId)

  if (queueIs(SlowStrumHandoverQueue)(oldState))
    return yield* advanceSlowStrumPatternTransition(
      oldState,
      pressedParamButtonId,
    )

  // Every LoopBoundQueue member is handled above.
  return yield* Effect.die(
    new Error('advanceLoopBound: unreachable queue shape'),
  )
})
