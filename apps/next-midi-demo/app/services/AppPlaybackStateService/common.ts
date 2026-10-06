import * as Schema from 'effect/Schema'

import {
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../.././domain/AssetPointer.ts'

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
