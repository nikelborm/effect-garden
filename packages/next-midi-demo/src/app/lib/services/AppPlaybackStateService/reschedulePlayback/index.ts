import * as Effect from 'effect/Effect'

import type { CurrentSelectedAsset } from '../../CurrentlySelectedAssetState.ts'
import type { AppPlaybackState } from '../types.ts'
import type { ReschedulePlaybackDeps } from './deps.ts'
import { fromPlayingLoop } from './fromPlayingLoop.ts'
import { fromPlayingSlowStrum } from './fromPlayingSlowStrum.ts'
import { fromScheduledLoopToAnotherLoopTransition } from './fromScheduledLoopToAnotherLoopTransition.ts'
import { fromScheduledLoopToSilenceTransition } from './fromScheduledLoopToSilenceTransition.ts'
import { fromScheduledSlowStrumToLoopTransition } from './fromScheduledSlowStrumToLoopTransition.ts'

export type { ReschedulePlaybackDeps } from './deps.ts'

export const reschedulePlayback = Effect.fn('reschedulePlayback')(function* (
  oldState: AppPlaybackState,
  asset: CurrentSelectedAsset,
  deps: ReschedulePlaybackDeps,
) {
  switch (oldState._tag) {
    case 'NotPlaying':
      return oldState
    case 'PlayingLoop':
      return yield* fromPlayingLoop(oldState, asset, deps)
    case 'ScheduledLoopToAnotherLoopTransition':
      return yield* fromScheduledLoopToAnotherLoopTransition(
        oldState,
        asset,
        deps,
      )
    case 'PlayingSlowStrum':
      return yield* fromPlayingSlowStrum(oldState, asset, deps)
    case 'ScheduledSlowStrumToLoopTransition':
      return yield* fromScheduledSlowStrumToLoopTransition(
        oldState,
        asset,
        deps,
      )
    case 'ScheduledLoopToSilenceTransition':
      return yield* fromScheduledLoopToSilenceTransition(oldState, asset, deps)
    default:
      return oldState
  }
})
