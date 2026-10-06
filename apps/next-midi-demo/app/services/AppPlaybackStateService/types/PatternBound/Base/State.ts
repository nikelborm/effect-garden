import * as Schema from 'effect/Schema'

import { PatternBoundBaseQueue } from './Queue.ts'

export class PatternBoundStateBase extends Schema.TaggedClass<PatternBoundStateBase>()(
  'PatternBoundStateBase',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: PatternBoundBaseQueue,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
