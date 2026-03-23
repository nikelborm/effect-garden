import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import type * as EAudioContext from 'effect-web-audio/EAudioContext'

import type * as Effect from 'effect/Effect'

import type { CurrentSelectedAsset } from '../../CurrentlySelectedAssetState.ts'
import type { CleanupFiberToolkit } from '../types.ts'

export interface ReschedulePlaybackDeps {
  readonly audioContext: EAudioContext.Instance
  readonly makeCleanupFibers: (
    delayForSeconds: number,
  ) => Effect.Effect<CleanupFiberToolkit>
  readonly getAudioBufferOfAsset: (
    asset: CurrentSelectedAsset,
  ) => Effect.Effect<EAudioBuffer.EAudioBuffer, any>
}
