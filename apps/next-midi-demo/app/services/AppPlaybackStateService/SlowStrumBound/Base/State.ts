import * as Schema from 'effect/Schema'

import { SlowStrumBoundQueue } from './Queue.ts'

export class SlowStrumBoundStateBase extends Schema.TaggedClass<SlowStrumBoundStateBase>()(
  'SlowStrumBoundStateBase',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: SlowStrumBoundQueue,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
