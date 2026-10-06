import * as Schema from 'effect/Schema'

import { AccordSchema } from '../../../../domain/Accord.ts'
import { StrengthSchema } from '../../../../domain/Strength.ts'
import { TwoPatternsFadingToSilenceQueue } from './PatternPatternSilenceTransition/Queue.ts'
import { PatternSilenceTransitionQueue } from './PatternSilenceTransition/Queue.ts'
import { SilenceQueue } from './Silence/Queue.ts'

export const SilenceBoundQueue = Schema.Union([
  SilenceQueue,
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
