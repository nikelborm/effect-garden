import * as Effect from 'effect/Effect'

import type { AppPlaybackState } from '../types/index.ts'
import { advancePatternBound } from './advancePatternBound.ts'
import { advanceSilenceBound } from './advanceSilenceBound.ts'
import { advanceSlowStrumBound } from './advanceSlowStrumBound.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advancePlayback = Effect.fn('advancePlayback')(function* (
  oldState: AppPlaybackState,
  pressedParamButtonId: PressedParamButtonId,
) {
  yield* Effect.log('advancePlayback', { oldState, pressedParamButtonId })
  switch (oldState._tag) {
    case 'SilenceBoundBaseState':
      return yield* advanceSilenceBound(oldState, pressedParamButtonId)
    case 'PatternBoundStateBase':
      return yield* advancePatternBound(oldState, pressedParamButtonId)
    case 'SlowStrumBoundStateBase':
      return yield* advanceSlowStrumBound(oldState, pressedParamButtonId)
    default: {
      oldState satisfies never
      return yield* Effect.die(
        new Error('advancePlayback: unreachable state shape'),
      )
    }
  }
})
