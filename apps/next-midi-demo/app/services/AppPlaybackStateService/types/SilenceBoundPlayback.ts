import * as Schema from 'effect/Schema'

import { AccordSchema } from '../../../domain/Accord.ts'
import { StrengthSchema } from '../../../domain/Strength.ts'
import { FadingOutLoopPlayback } from './loopElements.ts'

export const PureSilenceQueue = Schema.Tuple()

export const LoopFadingToSilenceQueue = Schema.Tuple(FadingOutLoopPlayback)

export const TwoLoopsFadingToSilenceQueue = Schema.Tuple(
  FadingOutLoopPlayback,
  FadingOutLoopPlayback,
)

export const SilenceBoundQueue = Schema.Union(
  PureSilenceQueue,
  LoopFadingToSilenceQueue,
  TwoLoopsFadingToSilenceQueue,
)
export type SilenceBoundQueue = typeof SilenceBoundQueue.Type

export class SilenceBoundPlayback extends Schema.TaggedClass<SilenceBoundPlayback>()(
  'SilenceBoundPlayback',
  {
    accord: AccordSchema,
    strength: StrengthSchema,
    transitionQueue: SilenceBoundQueue,
  },
) {
  protected declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
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
