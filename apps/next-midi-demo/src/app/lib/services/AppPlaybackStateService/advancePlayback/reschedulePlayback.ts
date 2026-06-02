import * as Effect from 'effect/Effect'

import type { AssetPointer } from '../../../brandsAndDatas/AssetPointer.ts'
import type { AppPlaybackState } from '../types/index.ts'
import { advancePatternPatternTransition } from './advancePatternPatternTransition.ts'
import { advancePatternSilenceTransition } from './advancePatternSilenceTransition.ts'
import { advancePlayingPattern } from './advancePlayingPattern.ts'
import { advancePlayingSlowStrum } from './advancePlayingSlowStrum.ts'
import { advanceSlowStrumPatternTransition } from './advanceSlowStrumPatternTransition.ts'
import type { ReschedulePlaybackDeps } from './deps.ts'

export type { ReschedulePlaybackDeps } from './deps.ts'

export const reschedulePlayback = Effect.fn('reschedulePlayback')(function* (
  oldState: AppPlaybackState,
  asset: AssetPointer,
  deps: ReschedulePlaybackDeps,
) {
  switch (oldState._tag) {
    case 'Silence':
      return oldState
    case 'PlayingPattern':
      return yield* advancePlayingPattern(oldState, asset, deps)
    case 'PatternPatternTransition':
      return yield* advancePatternPatternTransition(oldState, asset, deps)
    case 'PlayingSlowStrum':
      return yield* advancePlayingSlowStrum(oldState, asset, deps)
    case 'SlowStrumPatternTransition':
      return yield* advanceSlowStrumPatternTransition(oldState, asset, deps)
    case 'PatternSilenceTransition':
      return yield* advancePatternSilenceTransition(oldState, asset, deps)
    default:
      return oldState
  }
})
