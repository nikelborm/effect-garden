import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as Schema from 'effect/Schema'

import {
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../../domain/AssetPointer.ts'

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
  static {
    this.make = this.make.bind(this)
  }
  protected declare '~brand~': never

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
  protected declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}

export class PatternTransitionQueueElement extends Schema.TaggedClass<PatternTransitionQueueElement>()(
  'PatternTransitionQueueElement',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
  },
) {
  protected declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}

export class ScheduledPatternTransitionQueueElement extends PatternTransitionQueueElement.extend<ScheduledPatternTransitionQueueElement>(
  'ScheduledPatternTransitionQueueElement',
)({
  fadeInStartsAtSecond: Schema.Number,
  fadeInEndsAtSecond: Schema.Number,
}) {
  static {
    this.make = this.make.bind(this)
  }
}

export class SlowStrumTransitionQueueElement extends Schema.TaggedClass<SlowStrumTransitionQueueElement>()(
  'SlowStrumTransitionQueueElement',
  {
    asset: TaggedSlowStrumPointer,
    playback: AudioPlayback,
    durationSeconds: Schema.Number,
  },
) {
  protected declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
