import type { AudioBufferStore } from '../../AudioBufferStore.ts'
import type { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import type { AllWebAudioSideEffects } from '../webAudioSideEffects/All.ts'

export type AdvancePlaybackRequirements =
  | AllWebAudioSideEffects
  | AudioBufferStore
  | CleanupFiberMaker
