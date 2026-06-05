import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as Schema from 'effect/Schema'

import {
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../../brandsAndDatas/AssetPointer.ts'

export class AudioPlayback extends Schema.TaggedClass<AudioPlayback>()(
  'AudioPlayback',
  {
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
  },
) {
  private declare '~brand~': never

  getDuration() {
    const buffer = this.bufferSource.buffer
    if (!buffer)
      throw new Error('Assertion failed. expected buffer to be present')
    return buffer.duration
  }
}

export class CleanupFiberToolkit extends Schema.TaggedClass<CleanupFiberToolkit>()(
  'CleanupFiberToolkit',
  {
    cancelCleanup: Schema.declare(
      (u): u is Effect.Effect<void> => Effect.isEffect(u),
      { identifier: 'Effect<void>' },
    ),
    fiberWaitingSignalToStartGarbageCollection: Schema.declare(
      (u): u is Fiber.RuntimeFiber<void> =>
        Fiber.isFiber(u) && Fiber.isRuntimeFiber(u),
      { identifier: 'Fiber.RuntimeFiber<void>' },
    ),
    fiberWaitingDelayToGiveGarbageCollectionSignal: Schema.declare(
      (u): u is Fiber.RuntimeFiber<void> =>
        Fiber.isFiber(u) && Fiber.isRuntimeFiber(u),
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
  },
) {
  private declare '~brand~': never
}

export class PatternTransitionQueueElement extends Schema.TaggedClass<PatternTransitionQueueElement>()(
  'PatternTransitionQueueElement',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
  },
) {
  private declare '~brand~': never
}

export class PatternTransitionElementWithScheduledCleanup extends PatternTransitionQueueElement.extend<PatternTransitionElementWithScheduledCleanup>(
  'PatternTransitionElementWithScheduledCleanup',
)({
  cleanupFiberToolkit: CleanupFiberToolkit,
  fadeoutStartsAtSecond: Schema.Number,
  fadeoutEndsAtSecond: Schema.Number,
}) {}

export class SlowStrumTransitionQueueElement extends Schema.TaggedClass<SlowStrumTransitionQueueElement>()(
  'SlowStrumTransitionQueueElement',
  {
    asset: TaggedSlowStrumPointer,
    playback: AudioPlayback,
    durationSeconds: Schema.Number,
  },
) {
  private declare '~brand~': never
}
