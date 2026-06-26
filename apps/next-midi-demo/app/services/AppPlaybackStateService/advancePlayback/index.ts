import * as Effect from 'effect/Effect'

import type { AppPlaybackState } from '../types/index.ts'
import { advanceLoopBound } from './advanceLoopBound.ts'
import { advanceSilenceBound } from './advanceSilenceBound.ts'
import type { Signal } from './signal.ts'

export const advancePlayback = Effect.fn('advancePlayback')(function* (
  oldState: AppPlaybackState,
  signal: Signal,
) {
  yield* Effect.log('advancePlayback', { oldState, signal })
  switch (oldState._tag) {
    case 'SilenceBoundPlayback':
      return yield* advanceSilenceBound(oldState, signal)
    case 'LoopBoundPlayback':
      return yield* advanceLoopBound(oldState, signal)
  }
})
