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

// The most-recently-added (incoming) element of a transition queue. It is not
// yet scheduled for cleanup, but it DOES already know its own fade-in window —
// the raw slot seconds it was scheduled against (gain ramps min->max across
// [fadeInStartsAtSecond, fadeInEndsAtSecond]; it is fully audible / "live" at
// fadeInEndsAtSecond). Storing these raw values lets a later input recompute
// whether we can still reschedule this element vs. must append a new one.
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
