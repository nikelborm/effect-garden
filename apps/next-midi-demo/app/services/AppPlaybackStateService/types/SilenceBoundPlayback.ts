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

export class SilenceBoundPlayback extends Schema.TaggedClass<SilenceBoundPlayback>()(
  'SilenceBoundPlayback',
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
  static default = this.make({
    accord: defaultAccord,
    strength: defaultStrength,
    transitionQueue: [],
  })
}

export interface PureSilenceState extends SilenceBoundPlayback {
  readonly transitionQueue: typeof PureSilenceQueue.Type
}
export interface LoopFadingToSilenceState extends SilenceBoundPlayback {
  readonly transitionQueue: typeof LoopFadingToSilenceQueue.Type
}
export interface TwoLoopsFadingToSilenceState extends SilenceBoundPlayback {
  readonly transitionQueue: typeof TwoLoopsFadingToSilenceQueue.Type
}
