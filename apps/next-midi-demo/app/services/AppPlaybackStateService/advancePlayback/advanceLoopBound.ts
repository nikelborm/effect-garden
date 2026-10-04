import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import {
  FullLoopState,
  type LoopBoundPlayback,
  LoopRolloverHandoverState,
  LoopSilenceHandoverState,
  PlayingLoopState,
  PlayingSlowStrumState,
  SlowStrumHandoverState,
} from '../types/LoopBoundPlayback.ts'
import { advancePatternPatternPatternTransition } from './advancePatternPatternPatternTransition.ts'
import { advancePatternPatternTransition } from './advancePatternPatternTransition.ts'
import { advancePatternSilencePatternTransition } from './advancePatternSilencePatternTransition.ts'
import { advancePlayingPattern } from './advancePlayingPattern.ts'
import { advancePlayingSlowStrum } from './advancePlayingSlowStrum.ts'
import { advanceSlowStrumPatternTransition } from './advanceSlowStrumPatternTransition.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advanceLoopBound = Effect.fn('advanceLoopBound')(function* (
  oldState: LoopBoundPlayback,
  pressedParamButtonId: PressedParamButtonId,
) {
  if (Schema.is(PlayingLoopState)(oldState))
    return yield* advancePlayingPattern(oldState, pressedParamButtonId)

  if (Schema.is(LoopRolloverHandoverState)(oldState))
    return yield* advancePatternPatternTransition(
      oldState,
      pressedParamButtonId,
    )

  if (Schema.is(LoopSilenceHandoverState)(oldState))
    return yield* advancePatternSilencePatternTransition(
      oldState,
      pressedParamButtonId,
    )

  if (Schema.is(FullLoopState)(oldState))
    return yield* advancePatternPatternPatternTransition(
      oldState,
      pressedParamButtonId,
    )

  if (Schema.is(PlayingSlowStrumState)(oldState))
    return yield* advancePlayingSlowStrum(oldState, pressedParamButtonId)

  if (Schema.is(SlowStrumHandoverState)(oldState))
    return yield* advanceSlowStrumPatternTransition(
      oldState,
      pressedParamButtonId,
    )

  // Every LoopBoundPlayback member is handled above.
  return yield* Effect.die(
    new Error('advanceLoopBound: unreachable queue shape'),
  )
})
