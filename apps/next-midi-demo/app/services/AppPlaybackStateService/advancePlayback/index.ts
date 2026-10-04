import * as Effect from 'effect/Effect'

import type { AppPlaybackState } from '../types/index.ts'
import { advanceLoopBound } from './advanceLoopBound.ts'
import { advanceSilenceBound } from './advanceSilenceBound.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advancePlayback = Effect.fn('advancePlayback')(function* (
  oldState: AppPlaybackState,
  pressedParamButtonId: PressedParamButtonId,
) {
  yield* Effect.log('advancePlayback', { oldState, pressedParamButtonId })
  switch (oldState._tag) {
    case 'SilenceBoundPlaybackBase':
      return yield* advanceSilenceBound(oldState, pressedParamButtonId)
    case 'LoopBoundPlaybackBase':
      return yield* advanceLoopBound(oldState, pressedParamButtonId)
  }
})
