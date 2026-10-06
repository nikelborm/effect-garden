import * as Schema from 'effect/Schema'

import { TaggedSlowStrumPointer } from '../../../domain/AssetPointer.ts'
import {
  AudioPlayback,
  ScheduledPatternTransitionQueueElement,
  SlowStrumTransitionQueueElement,
} from './common.ts'

export class SlowStrumEnqued extends Schema.TaggedClass<SlowStrumEnqued>()(
  'SlowStrumEnqued',
  {
    playbackStartedAtSecond: Schema.Number,
    asset: TaggedSlowStrumPointer,
    playback: AudioPlayback,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  getDuration() {
    return this.playback.getDuration()
  }
}

export const SlowStrumQueue = Schema.Tuple([SlowStrumEnqued])
export const isSlowStrumQueue = Schema.is(SlowStrumQueue)

export const SlowStrumPatternTransitionQueue = Schema.Tuple([
  SlowStrumTransitionQueueElement,
  ScheduledPatternTransitionQueueElement,
])
export const isSlowStrumPatternTransitionQueue = Schema.is(
  SlowStrumPatternTransitionQueue,
)

export const SlowStrumBoundQueue = Schema.Union([
  SlowStrumQueue,
  SlowStrumPatternTransitionQueue,
])
export type SlowStrumBoundQueue = typeof SlowStrumBoundQueue.Type

export class SlowStrumBoundStateBase extends Schema.TaggedClass<SlowStrumBoundStateBase>()(
  'SlowStrumBoundStateBase',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: SlowStrumBoundQueue,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}

export class SlowStrumState extends SlowStrumBoundStateBase.extend<SlowStrumState>(
  'SlowStrumState',
)({
  transitionQueue: SlowStrumQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is SlowStrumState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export class SlowStrumPatternTransitionState extends SlowStrumBoundStateBase.extend<SlowStrumPatternTransitionState>(
  'SlowStrumPatternTransitionState',
)({
  transitionQueue: SlowStrumPatternTransitionQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is SlowStrumPatternTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export const SlowStrumBoundState = Schema.Union([
  SlowStrumState,
  SlowStrumPatternTransitionState,
])
export type SlowStrumBoundState = typeof SlowStrumBoundState.Type
