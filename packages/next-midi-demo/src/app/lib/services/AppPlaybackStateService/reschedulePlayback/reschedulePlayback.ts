import * as Effect from 'effect/Effect'

import type { AssetPointer } from '../../../audioAssetHelpers.ts'
import type { AppPlaybackState } from '../types/index.ts'
import { advanceLoopToLoopTransition } from './advanceLoopToLoopTransition.ts'
import { advanceLoopToSilenceTransition } from './advanceLoopToSilenceTransition.ts'
import { advancePlayingLoop } from './advancePlayingLoop.ts'
import { advancePlayingSlowStrum } from './advancePlayingSlowStrum.ts'
import { advanceSlowStrumToLoopTransition } from './advanceSlowStrumToLoopTransition.ts'
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
    case 'LoopToLoopTransition':
      return yield* advanceLoopToLoopTransition(oldState, asset, deps)
    case 'PlayingSlowStrum':
      return yield* advancePlayingSlowStrum(oldState, asset, deps)
    case 'SlowStrumToLoopTransition':
      return yield* advanceSlowStrumToLoopTransition(oldState, asset, deps)
    case 'LoopToSilenceTransition':
      return yield* advanceLoopToSilenceTransition(oldState, asset, deps)
    default:
      return oldState
  }
})
