import * as Schema from 'effect/Schema'

import { AccordSchema, defaultAccord } from '../../../domain/Accord.ts'
import { defaultStrength, StrengthSchema } from '../../../domain/Strength.ts'
import { FadingOutLoopPlayback } from './loopElements.ts'

export const PureSilenceQueue = Schema.Tuple([])

export const LoopFadingToSilenceQueue = Schema.Tuple([FadingOutLoopPlayback])

export const TwoLoopsFadingToSilenceQueue = Schema.Tuple([
  FadingOutLoopPlayback,
  FadingOutLoopPlayback,
])

export const SilenceBoundQueue = Schema.Union([
  PureSilenceQueue,
  LoopFadingToSilenceQueue,
  TwoLoopsFadingToSilenceQueue,
])
export type SilenceBoundQueue = typeof SilenceBoundQueue.Type

export class SilenceBoundPlaybackBase extends Schema.TaggedClass<SilenceBoundPlaybackBase>()(
  'SilenceBoundPlaybackBase',
  {
    accord: AccordSchema,
    strength: StrengthSchema,
    transitionQueue: SilenceBoundQueue,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}

export class PureSilenceState extends SilenceBoundPlaybackBase.extend<PureSilenceState>(
  'PureSilenceState',
)({
  transitionQueue: PureSilenceQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is PureSilenceState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
  static default = this.make({
    accord: defaultAccord,
    strength: defaultStrength,
    transitionQueue: [],
  })
}

export class LoopFadingToSilenceState extends SilenceBoundPlaybackBase.extend<LoopFadingToSilenceState>(
  'LoopFadingToSilenceState',
)({
  transitionQueue: LoopFadingToSilenceQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is LoopFadingToSilenceState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export class TwoLoopsFadingToSilenceState extends SilenceBoundPlaybackBase.extend<TwoLoopsFadingToSilenceState>(
  'TwoLoopsFadingToSilenceState',
)({
  transitionQueue: TwoLoopsFadingToSilenceQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is TwoLoopsFadingToSilenceState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export const SilenceBoundPlayback = Schema.Union([
  PureSilenceState,
  LoopFadingToSilenceState,
  TwoLoopsFadingToSilenceState,
])
export type SilenceBoundPlayback = typeof SilenceBoundPlayback.Type
