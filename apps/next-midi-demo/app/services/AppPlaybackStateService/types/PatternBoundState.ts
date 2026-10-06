import * as Schema from 'effect/Schema'

import {
  ScheduledPatternTransitionQueueElement,
  SlowStrumTransitionQueueElement,
} from './common.ts'
import {
  FadingOutPatternPlayback,
  IncomingPatternFadingIn,
  PatternPlayback,
  PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
  PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
} from './loopElements.ts'
import { SlowStrumEnqued } from './SlowStrumBoundState.ts'

export const PatternQueue = Schema.Tuple([PatternPlayback])
export const isPatternQueue = Schema.is(PatternQueue)

export const PatternPatternTransitionQueue = Schema.Tuple([
  PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
  IncomingPatternFadingIn,
])
export const isPatternPatternTransitionQueue = Schema.is(
  PatternPatternTransitionQueue,
)

export const PatternSilencePatternTransitionQueue = Schema.Tuple([
  PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
  IncomingPatternFadingIn,
])
export const isPatternSilencePatternTransitionQueue = Schema.is(
  PatternSilencePatternTransitionQueue,
)

export const PatternPatternPatternTransitionQueue = Schema.Tuple([
  FadingOutPatternPlayback,
  FadingOutPatternPlayback,
  IncomingPatternFadingIn,
])
export const isPatternPatternPatternTransitionQueue = Schema.is(
  PatternPatternPatternTransitionQueue,
)

export const PatternBoundQueue = Schema.Union([
  PatternQueue,
  PatternPatternTransitionQueue,
  PatternSilencePatternTransitionQueue,
  PatternPatternPatternTransitionQueue,
])
export type PatternBoundQueue = typeof PatternBoundQueue.Type

export class PatternBoundStateBase extends Schema.TaggedClass<PatternBoundStateBase>()(
  'PatternBoundStateBase',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: PatternBoundQueue,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}

export class PatternState extends PatternBoundStateBase.extend<PatternState>(
  'PatternState',
)({
  transitionQueue: PatternQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is PatternState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export class PatternPatternTransitionState extends PatternBoundStateBase.extend<PatternPatternTransitionState>(
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

export class PatternSilencePatternTransitionState extends PatternBoundStateBase.extend<PatternSilencePatternTransitionState>(
  'PatternSilencePatternTransitionState',
)({
  transitionQueue: PatternSilencePatternTransitionQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternSilencePatternTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export class PatternPatternPatternTransitionState extends PatternBoundStateBase.extend<PatternPatternPatternTransitionState>(
  'PatternPatternPatternTransitionState',
)({
  transitionQueue: PatternPatternPatternTransitionQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternPatternPatternTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export const PatternBoundPlayback = Schema.Union([
  PatternState,
  PatternPatternTransitionState,
  PatternSilencePatternTransitionState,
  PatternPatternPatternTransitionState,
])
export type PatternBoundPlayback = typeof PatternBoundPlayback.Type
