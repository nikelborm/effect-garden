import * as Schema from 'effect/Schema'

import { PatternBoundBaseQueue } from './Queue.ts'

export class PatternBoundBaseState extends Schema.TaggedClass<PatternBoundBaseState>()(
  'PatternBoundBaseState',
  {
    playbackStartedAtSecond: Schema.Finite,
    transitionQueue: PatternBoundBaseQueue,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
