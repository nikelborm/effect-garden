import type { AudioBufferStore } from '../../AudioBufferStore.ts'
import type { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import type { AllWebAudioSideEffects } from '../webAudioSideEffects/AllWebAudioSideEffects.ts'

export type AdvancePlaybackRequirements =
  | AllWebAudioSideEffects
  | AudioBufferStore
  | CleanupFiberMaker
