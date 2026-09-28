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
  declare protected '~brand~': never

  getDuration() {
    const buffer = this.bufferSource.buffer
    if (!buffer)
      throw new Error('Assertion failed. expected buffer to be present')
    return buffer.duration
  }
}

const EffectVoidSchema = Schema.declare(
  (u): u is Effect.Effect<void> => Effect.isEffect(u),
  { identifier: 'Effect<void>' },
)

const FiberVoidSchema = Schema.declare(
  (u): u is Fiber.Fiber<void> => Fiber.isFiber(u),
  { identifier: 'Fiber.Fiber<void>' },
)

export class CleanupFiberToolkit extends Schema.TaggedClass<CleanupFiberToolkit>()(
  'CleanupFiberToolkit',
  {
    cancelCleanup: EffectVoidSchema,
    fiberWaitingSignalToStartGarbageCollection: FiberVoidSchema,
    fiberWaitingDelayToGiveGarbageCollectionSignal: FiberVoidSchema,
    cancelDelayedCleanupSignal: EffectVoidSchema,
    cleanupImmediately: EffectVoidSchema,
  },
) {
  declare protected '~brand~': never
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
  declare protected '~brand~': never
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
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
