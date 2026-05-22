import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as Schema from 'effect/Schema'

import {
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../../audioAssetHelpers.ts'

const AssetPointerSchema = Schema.Union(
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
)

// GOD DAMNN

export const AudioPlaybackSchema = Schema.Struct({
  bufferSource: Schema.declare(
    (u): u is AudioBufferSourceNode =>
      typeof AudioBufferSourceNode !== 'undefined' &&
      u instanceof AudioBufferSourceNode,
    { identifier: 'AudioBufferSourceNode' },
  ),
  gainNode: Schema.declare(
    (u): u is GainNode =>
      typeof GainNode !== 'undefined' && u instanceof GainNode,
    { identifier: 'GainNode' },
  ),
})
export type AudioPlayback = Schema.Schema.Type<typeof AudioPlaybackSchema>

export const CleanupFiberToolkitSchema = Schema.Struct({
  cancelCleanup: Schema.declare(
    (u): u is Effect.Effect<void> => Effect.isEffect(u),
    { identifier: 'Effect<void>' },
  ),
  fiberWaitingSignalToStartGarbageCollection: Schema.declare(
    (u): u is Fiber.RuntimeFiber<void> => Fiber.isRuntimeFiber(u),
    { identifier: 'Fiber.RuntimeFiber<void>' },
  ),
  fiberWaitingDelayToGiveGarbageCollectionSignal: Schema.declare(
    (u): u is Fiber.RuntimeFiber<void> => Fiber.isRuntimeFiber(u),
    { identifier: 'Fiber.RuntimeFiber<void>' },
  ),
  cancelDelayedCleanupSignal: Schema.declare(
    (u): u is Effect.Effect<void> => Effect.isEffect(u),
    { identifier: 'Effect<void>' },
  ),
  cleanupImmediately: Schema.declare(
    (u): u is Effect.Effect<void> => Effect.isEffect(u),
    { identifier: 'Effect<void>' },
  ),
})
export type CleanupFiberToolkit = Schema.Schema.Type<
  typeof CleanupFiberToolkitSchema
>

export const LoopTransitionQueueElementSchema = Schema.Struct({
  asset: AssetPointerSchema,
  playback: AudioPlaybackSchema,
})
export type LoopTransitionQueueElement = Schema.Schema.Type<
  typeof LoopTransitionQueueElementSchema
>

export const LoopTransitionElementWithScheduledCleanupSchema = Schema.Struct({
  ...LoopTransitionQueueElementSchema.fields,
  cleanupFiberToolkit: CleanupFiberToolkitSchema,
  fadeoutStartsAtSecond: Schema.Number,
  fadeoutEndsAtSecond: Schema.Number,
})
export type LoopTransitionElementWithScheduledCleanup = Schema.Schema.Type<
  typeof LoopTransitionElementWithScheduledCleanupSchema
>

export const SlowStrumTransitionQueueElementSchema = Schema.Struct({
  asset: AssetPointerSchema,
  playback: AudioPlaybackSchema,
  durationSeconds: Schema.Number,
})
export type SlowStrumTransitionQueueElement = Schema.Schema.Type<
  typeof SlowStrumTransitionQueueElementSchema
>
