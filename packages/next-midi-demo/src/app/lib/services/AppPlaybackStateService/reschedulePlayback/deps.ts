import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import type * as EAudioContext from 'effect-web-audio/EAudioContext'

import type * as Effect from 'effect/Effect'

import type { AssetPointer } from '../../../audioAssetHelpers.ts'
import type { CleanupFiberToolkit } from '../types/index.ts'

export interface ReschedulePlaybackDeps {
  readonly audioContext: EAudioContext.Instance
  readonly makeCleanupFibers: (
    delayForSeconds: number,
  ) => Effect.Effect<CleanupFiberToolkit>
  readonly getAudioBufferOfAsset: (
    asset: AssetPointer,
  ) => Effect.Effect<EAudioBuffer.EAudioBuffer, any>
}
