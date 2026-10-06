import * as Schema from 'effect/Schema'

import { AccordSchema, defaultAccord } from '../../../domain/Accord.ts'
import { defaultStrength, StrengthSchema } from '../../../domain/Strength.ts'
import { FadingOutPatternPlayback } from './loopElements.ts'

export const PureSilenceQueue = Schema.Tuple([])

export const PatternSilenceTransitionQueue = Schema.Tuple([
  FadingOutPatternPlayback,
])

export const TwoPatternsFadingToSilenceQueue = Schema.Tuple([
  FadingOutPatternPlayback,
  FadingOutPatternPlayback,
])

export const SilenceBoundQueue = Schema.Union([
  PureSilenceQueue,
  PatternSilenceTransitionQueue,
  TwoPatternsFadingToSilenceQueue,
])
export type SilenceBoundQueue = typeof SilenceBoundQueue.Type

export class SilenceBoundStateBase extends Schema.TaggedClass<SilenceBoundStateBase>()(
  'SilenceBoundStateBase',
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

export class SilenceState extends SilenceBoundStateBase.extend<SilenceState>(
  'SilenceState',
)({
  transitionQueue: PureSilenceQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is SilenceState =
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

export class PatternSilenceTransitionState extends SilenceBoundStateBase.extend<PatternSilenceTransitionState>(
  'PatternSilenceTransitionState',
)({
  transitionQueue: PatternSilenceTransitionQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternSilenceTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export class PatternPatternSilenceTransitionState extends SilenceBoundStateBase.extend<PatternPatternSilenceTransitionState>(
  'PatternPatternSilenceTransitionState',
)({
  transitionQueue: TwoPatternsFadingToSilenceQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternPatternSilenceTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }
}

export const SilenceBoundState = Schema.Union([
  SilenceState,
  PatternSilenceTransitionState,
  PatternPatternSilenceTransitionState,
])
export type SilenceBoundState = typeof SilenceBoundState.Type
