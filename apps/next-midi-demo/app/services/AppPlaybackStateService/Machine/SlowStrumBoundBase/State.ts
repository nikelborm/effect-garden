import * as Schema from 'effect/Schema'

import { SlowStrumBoundQueue } from './Queue.ts'

export class SlowStrumBoundBaseState extends Schema.TaggedClass<SlowStrumBoundBaseState>()(
  'SlowStrumBoundBaseState',
  {
    playbackStartedAtSecond: Schema.Finite,
    transitionQueue: SlowStrumBoundQueue,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
