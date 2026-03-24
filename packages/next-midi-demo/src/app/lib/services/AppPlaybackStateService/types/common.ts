import type * as Effect from 'effect/Effect'
import type * as Fiber from 'effect/Fiber'

import type { AssetPointer } from '../../../audioAssetHelpers.ts'

export type AudioPlayback = {
  readonly bufferSource: AudioBufferSourceNode
  readonly gainNode: GainNode
}

export interface CleanupFiberToolkit {
  readonly cancelCleanup: Effect.Effect<void>
  readonly fiberWaitingSignalToStartGarbageCollection: Fiber.RuntimeFiber<void>
  readonly fiberWaitingDelayToGiveGarbageCollectionSignal: Fiber.RuntimeFiber<void>
  readonly cancelDelayedCleanupSignal: Effect.Effect<void>
  readonly cleanupImmediately: Effect.Effect<void>
}

export interface LoopTransitionQueueElement {
  readonly asset: AssetPointer
  readonly playback: AudioPlayback
}

export interface LoopTransitionElementWithScheduledCleanup
  extends LoopTransitionQueueElement {
  readonly cleanupFiberToolkit: CleanupFiberToolkit
  readonly fadeoutStartsAtSecond: number
  readonly fadeoutEndsAtSecond: number
}

export interface SlowStrumTransitionQueueElement {
  readonly asset: AssetPointer
  readonly playback: AudioPlayback
  readonly durationSeconds: number
}
