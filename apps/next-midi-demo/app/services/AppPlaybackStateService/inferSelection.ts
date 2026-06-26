import * as Option from 'effect/Option'

import {
  type SimpleAssetPointer,
  simplifyAssetPointer,
} from '../../domain/AssetPointer.ts'
import type { AppPlaybackState } from './types/index.ts'

// Pure derivations of the two per-button UI flags from the single playback
// state — the state machine is the source of truth, so these replace the old
// drifting registries. Both are total over the state union.

// The latest-SCHEDULED selection (what the user is heading toward). accord and
// strength always exist — Silence and the to-silence transitions carry them as
// the base selection — while pattern is None whenever the destination is
// silence. For the multi-loop transitions the destination is the last element.
export const inferSelection = (state: AppPlaybackState): SimpleAssetPointer => {
  switch (state._tag) {
    case 'Silence':
    case 'PatternSilenceTransition':
    case 'PatternPatternSilenceTransition':
      return {
        accord: state.accord,
        pattern: Option.none(),
        strength: state.strength,
      }
    case 'PlayingPattern':
    case 'PlayingSlowStrum':
      return simplifyAssetPointer(state.asset)
    case 'PatternPatternTransition':
    case 'PatternSilencePatternTransition':
    case 'SlowStrumPatternTransition':
      return simplifyAssetPointer(state.transitionQueue[1].asset)
    case 'PatternPatternPatternTransition':
      return simplifyAssetPointer(state.transitionQueue[2].asset)
  }
}

// What is actually SOUNDING right now = the oldest / currently-dominant queue
// element (a loop keeps "playing" while it fades out). None during silence.
export const inferPlaying = (
  state: AppPlaybackState,
): Option.Option<SimpleAssetPointer> => {
  switch (state._tag) {
    case 'Silence':
      return Option.none()
    case 'PlayingPattern':
    case 'PlayingSlowStrum':
      return Option.some(simplifyAssetPointer(state.asset))
    default:
      return Option.some(simplifyAssetPointer(state.transitionQueue[0].asset))
  }
}
