import * as Schema from 'effect/Schema'

import {
  ScheduledPatternTransitionQueueElement,
  SlowStrumTransitionQueueElement,
} from './common.ts'
import {
  FadingOutLoopPlayback,
  IncomingLoopFadingIn,
  LoopPlaybackAtItsLastPlayWithScheduledLongFadeout,
  LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop,
  PlayingLoopPlayback,
} from './loopElements.ts'
import { PlayingSlowStrum } from './PlayingSlowStrum.ts'

export const PlayingLoopQueue = Schema.Tuple([PlayingLoopPlayback])
export const isPlayingLoopQueue = Schema.is(PlayingLoopQueue)

export const LoopRolloverHandoverQueue = Schema.Tuple([
  LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop,
  IncomingLoopFadingIn,
])
export const isLoopRolloverHandoverQueue = Schema.is(LoopRolloverHandoverQueue)

export const LoopSilenceHandoverQueue = Schema.Tuple([
  LoopPlaybackAtItsLastPlayWithScheduledLongFadeout,
  IncomingLoopFadingIn,
])
export const isLoopSilenceHandoverQueue = Schema.is(LoopSilenceHandoverQueue)

export const FullLoopQueue = Schema.Tuple([
  FadingOutLoopPlayback,
  FadingOutLoopPlayback,
  IncomingLoopFadingIn,
])
export const isFullLoopQueue = Schema.is(FullLoopQueue)

export const PlayingSlowStrumQueue = Schema.Tuple([PlayingSlowStrum])
export const isPlayingSlowStrumQueue = Schema.is(PlayingSlowStrumQueue)

export const SlowStrumHandoverQueue = Schema.Tuple([
  SlowStrumTransitionQueueElement,
  ScheduledPatternTransitionQueueElement,
])
export const isSlowStrumHandoverQueue = Schema.is(SlowStrumHandoverQueue)

export const LoopBoundQueue = Schema.Union([
  PlayingLoopQueue,
  LoopRolloverHandoverQueue,
  LoopSilenceHandoverQueue,
  FullLoopQueue,
  PlayingSlowStrumQueue,
  SlowStrumHandoverQueue,
])
export type LoopBoundQueue = typeof LoopBoundQueue.Type

export class LoopBoundPlaybackBase extends Schema.TaggedClass<LoopBoundPlaybackBase>()(
  'LoopBoundPlaybackBase',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: LoopBoundQueue,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}

export class PlayingLoopState extends LoopBoundPlaybackBase.extend<PlayingLoopState>(
  'PlayingLoopState',
)({
  transitionQueue: PlayingLoopQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is PlayingLoopState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export class LoopRolloverHandoverState extends LoopBoundPlaybackBase.extend<LoopRolloverHandoverState>(
  'LoopRolloverHandoverState',
)({
  transitionQueue: LoopRolloverHandoverQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is LoopRolloverHandoverState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export class LoopSilenceHandoverState extends LoopBoundPlaybackBase.extend<LoopSilenceHandoverState>(
  'LoopSilenceHandoverState',
)({
  transitionQueue: LoopSilenceHandoverQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is LoopSilenceHandoverState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export class FullLoopState extends LoopBoundPlaybackBase.extend<FullLoopState>(
  'FullLoopState',
)({
  transitionQueue: FullLoopQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is FullLoopState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export class PlayingSlowStrumState extends LoopBoundPlaybackBase.extend<PlayingSlowStrumState>(
  'PlayingSlowStrumState',
)({
  transitionQueue: PlayingSlowStrumQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is PlayingSlowStrumState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export class SlowStrumHandoverState extends LoopBoundPlaybackBase.extend<SlowStrumHandoverState>(
  'SlowStrumHandoverState',
)({
  transitionQueue: SlowStrumHandoverQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is SlowStrumHandoverState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export const LoopBoundPlayback = Schema.Union([
  PlayingLoopState,
  LoopRolloverHandoverState,
  LoopSilenceHandoverState,
  FullLoopState,
  PlayingSlowStrumState,
  SlowStrumHandoverState,
])
export type LoopBoundPlayback = typeof LoopBoundPlayback.Type
