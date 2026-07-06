import * as Option from 'effect/Option'

import {
  type SimpleAssetPointer,
  simplifyAssetPointer,
} from '../../domain/AssetPointer.ts'
import type { AppPlaybackState } from './types/index.ts'

export const inferSelection = (state: AppPlaybackState): SimpleAssetPointer => {
  if (state._tag === 'SilenceBoundPlayback')
    return {
      accord: state.accord,
      pattern: Option.none(),
      strength: state.strength,
    }
  const queue = state.transitionQueue
  const destination =
    queue.length === 1 ? queue[0] : queue.length === 2 ? queue[1] : queue[2]
  return simplifyAssetPointer(destination.asset)
}

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
