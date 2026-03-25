import * as Effect from 'effect/Effect'

import type { AssetPointer } from '../../../audioAssetHelpers.ts'
import type { AppPlaybackState } from '../types/index.ts'
import { advanceLoopLoopTransition } from './advanceLoopLoopTransition.ts'
import { advanceLoopSilenceTransition } from './advanceLoopSilenceTransition.ts'
import { advancePlayingLoop } from './advancePlayingLoop.ts'
import { advancePlayingSlowStrum } from './advancePlayingSlowStrum.ts'
import { advanceSlowStrumLoopTransition } from './advanceSlowStrumLoopTransition.ts'
import type { ReschedulePlaybackDeps } from './deps.ts'

export type { ReschedulePlaybackDeps } from './deps.ts'

export const reschedulePlayback = Effect.fn('reschedulePlayback')(function* (
  oldState: AppPlaybackState,
  asset: AssetPointer,
  deps: ReschedulePlaybackDeps,
) {
  switch (oldState._tag) {
    case 'NotPlaying':
      return oldState
    case 'PlayingLoop':
      return yield* advancePlayingLoop(oldState, asset, deps)
    case 'LoopLoopTransition':
      return yield* advanceLoopLoopTransition(oldState, asset, deps)
    case 'PlayingSlowStrum':
      return yield* advancePlayingSlowStrum(oldState, asset, deps)
    case 'SlowStrumLoopTransition':
      return yield* advanceSlowStrumLoopTransition(oldState, asset, deps)
    case 'LoopSilenceTransition':
      return yield* advanceLoopSilenceTransition(oldState, asset, deps)
    default:
      return oldState
  }
})
