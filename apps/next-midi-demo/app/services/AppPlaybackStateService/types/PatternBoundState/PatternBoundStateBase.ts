import * as Schema from 'effect/Schema'

import { PatternQueue } from './Pattern/Queue.ts'
import { PatternPatternPatternTransitionQueue } from './PatternPatternPatternTransition/Queue.ts'
import { PatternPatternTransitionQueue } from './PatternPatternTransition/Queue.ts'
import { PatternSilencePatternTransitionQueue } from './PatternSilencePatternTransition/Queue.ts'

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
