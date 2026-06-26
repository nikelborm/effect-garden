import * as Option from 'effect/Option'

import {
  type SimpleAssetPointer,
  simplifyAssetPointer,
} from '../../domain/AssetPointer.ts'
import type { AppPlaybackState } from './types/index.ts'

// Pure derivations of the two per-button UI flags from the single playback
// state — the state machine is the source of truth, so these replace the old
// drifting registries. Both are total over the two-class state union.

// The latest-SCHEDULED selection (what the user is heading toward). accord and
// strength always exist — SilenceBoundPlayback carries them as the base
// selection — while pattern is None whenever the destination is silence. For a
// LoopBoundPlayback the destination is the LAST queue element.
export const inferSelection = (state: AppPlaybackState): SimpleAssetPointer => {
  if (state._tag === 'SilenceBoundPlayback')
    return {
      accord: state.accord,
      pattern: Option.none(),
      strength: state.strength,
    }
  const q = state.transitionQueue
  const destination = q.length === 1 ? q[0] : q.length === 2 ? q[1] : q[2]
  return simplifyAssetPointer(destination.asset)
}

// What is actually SOUNDING right now = the oldest / currently-dominant queue
// element (a loop keeps "playing" while it fades out). None only during pure
// silence (an empty SilenceBoundPlayback queue).
export const inferPlaying = (
  state: AppPlaybackState,
): Option.Option<SimpleAssetPointer> => {
  if (state._tag === 'SilenceBoundPlayback') {
    const q = state.transitionQueue
    return q.length === 0
      ? Option.none()
      : Option.some(simplifyAssetPointer(q[0].asset))
  }
  return Option.some(simplifyAssetPointer(state.transitionQueue[0].asset))
}
