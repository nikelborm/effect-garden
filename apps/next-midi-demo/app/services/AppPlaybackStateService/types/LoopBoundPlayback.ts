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

export const PatternPatternTransitionQueue = Schema.Tuple([
  LoopPlaybackScheduledWithShortFadeoutBeforeAnotherLoop,
  IncomingLoopFadingIn,
])
export const isPatternPatternTransitionQueue = Schema.is(
  PatternPatternTransitionQueue,
)

export const LoopSilenceTransitionQueue = Schema.Tuple([
  LoopPlaybackAtItsLastPlayWithScheduledLongFadeout,
  IncomingLoopFadingIn,
])
export const isLoopSilenceTransitionQueue = Schema.is(LoopSilenceTransitionQueue)

export const FullLoopQueue = Schema.Tuple([
  FadingOutLoopPlayback,
  FadingOutLoopPlayback,
  IncomingLoopFadingIn,
])
export const isFullLoopQueue = Schema.is(FullLoopQueue)

export const PlayingSlowStrumQueue = Schema.Tuple([PlayingSlowStrum])
export const isPlayingSlowStrumQueue = Schema.is(PlayingSlowStrumQueue)

export const SlowStrumTransitionQueue = Schema.Tuple([
  SlowStrumTransitionQueueElement,
  ScheduledPatternTransitionQueueElement,
])
export const isSlowStrumTransitionQueue = Schema.is(SlowStrumTransitionQueue)

export const LoopBoundQueue = Schema.Union([
  PlayingLoopQueue,
  PatternPatternTransitionQueue,
  LoopSilenceTransitionQueue,
  FullLoopQueue,
  PlayingSlowStrumQueue,
  SlowStrumTransitionQueue,
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

export class PatternPatternTransitionState extends LoopBoundPlaybackBase.extend<PatternPatternTransitionState>(
  'PatternPatternTransitionState',
)({
  transitionQueue: PatternPatternTransitionQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternPatternTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export class LoopSilenceTransitionState extends LoopBoundPlaybackBase.extend<LoopSilenceTransitionState>(
  'LoopSilenceTransitionState',
)({
  transitionQueue: LoopSilenceTransitionQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is LoopSilenceTransitionState =
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

export class SlowStrumTransitionState extends LoopBoundPlaybackBase.extend<SlowStrumTransitionState>(
  'SlowStrumTransitionState',
)({
  transitionQueue: SlowStrumTransitionQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is SlowStrumTransitionState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export const LoopBoundPlayback = Schema.Union([
  PlayingLoopState,
  PatternPatternTransitionState,
  LoopSilenceTransitionState,
  FullLoopState,
  PlayingSlowStrumState,
  SlowStrumTransitionState,
])
export type LoopBoundPlayback = typeof LoopBoundPlayback.Type
