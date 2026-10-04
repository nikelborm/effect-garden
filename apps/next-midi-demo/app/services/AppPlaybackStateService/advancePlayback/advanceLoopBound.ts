import * as Effect from 'effect/Effect'

import {
  FullLoopState,
  type LoopBoundPlayback,
  LoopSilenceTransitionState,
  PatternPatternTransitionState,
  PlayingLoopState,
  PlayingSlowStrumState,
  SlowStrumTransitionState,
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
  if (PlayingLoopState.models(oldState))
    return yield* advancePlayingPattern(oldState, pressedParamButtonId)

  if (PatternPatternTransitionState.models(oldState))
    return yield* advancePatternPatternTransition(
      oldState,
      pressedParamButtonId,
    )

  if (LoopSilenceTransitionState.models(oldState))
    return yield* advancePatternSilencePatternTransition(
      oldState,
      pressedParamButtonId,
    )

  if (FullLoopState.models(oldState))
    return yield* advancePatternPatternPatternTransition(
      oldState,
      pressedParamButtonId,
    )

  if (PlayingSlowStrumState.models(oldState))
    return yield* advancePlayingSlowStrum(oldState, pressedParamButtonId)

  if (SlowStrumTransitionState.models(oldState))
    return yield* advanceSlowStrumPatternTransition(
      oldState,
      pressedParamButtonId,
    )

  oldState satisfies never

  // Every LoopBoundPlayback member is handled above.
  return yield* Effect.die(
    new Error('advanceLoopBound: unreachable state shape'),
  )
})
