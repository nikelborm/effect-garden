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

export const PlayingLoopQueue = Schema.Tuple(PlayingLoopPlayback)
export const isPlayingLoopQueue = Schema.is(PlayingLoopQueue)

export const LoopRolloverHandoverQueue = Schema.Tuple(
  LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop,
  IncomingLoopFadingIn,
)
export const isLoopRolloverHandoverQueue = Schema.is(LoopRolloverHandoverQueue)

export const LoopSilenceHandoverQueue = Schema.Tuple(
  LoopPlaybackAtItsLastPlayWithScheduledLongFadeout,
  IncomingLoopFadingIn,
)
export const isLoopSilenceHandoverQueue = Schema.is(LoopSilenceHandoverQueue)

export const FullLoopQueue = Schema.Tuple(
  FadingOutLoopPlayback,
  FadingOutLoopPlayback,
  IncomingLoopFadingIn,
)
export const isFullLoopQueue = Schema.is(FullLoopQueue)

export const PlayingSlowStrumQueue = Schema.Tuple(PlayingSlowStrum)
export const isPlayingSlowStrumQueue = Schema.is(PlayingSlowStrumQueue)

export const SlowStrumHandoverQueue = Schema.Tuple(
  SlowStrumTransitionQueueElement,
  ScheduledPatternTransitionQueueElement,
)
export const isSlowStrumHandoverQueue = Schema.is(SlowStrumHandoverQueue)

export const LoopBoundQueue = Schema.Union(
  PlayingLoopQueue,
  LoopRolloverHandoverQueue,
  LoopSilenceHandoverQueue,
  FullLoopQueue,
  PlayingSlowStrumQueue,
  SlowStrumHandoverQueue,
)
export type LoopBoundQueue = typeof LoopBoundQueue.Type

export class LoopBoundPlayback extends Schema.TaggedClass<LoopBoundPlayback>()(
  'LoopBoundPlayback',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: LoopBoundQueue,
  },
) {
  protected declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}

export interface PlayingLoopState extends LoopBoundPlayback {
  readonly transitionQueue: typeof PlayingLoopQueue.Type
}
export interface LoopRolloverHandoverState extends LoopBoundPlayback {
  readonly transitionQueue: typeof LoopRolloverHandoverQueue.Type
}
export interface LoopSilenceHandoverState extends LoopBoundPlayback {
  readonly transitionQueue: typeof LoopSilenceHandoverQueue.Type
}
export interface FullLoopState extends LoopBoundPlayback {
  readonly transitionQueue: typeof FullLoopQueue.Type
}
export interface PlayingSlowStrumState extends LoopBoundPlayback {
  readonly transitionQueue: typeof PlayingSlowStrumQueue.Type
}
export interface SlowStrumHandoverState extends LoopBoundPlayback {
  readonly transitionQueue: typeof SlowStrumHandoverQueue.Type
}
