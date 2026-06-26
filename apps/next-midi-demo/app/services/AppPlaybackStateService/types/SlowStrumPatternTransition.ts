import * as Schema from 'effect/Schema'

import {
  ScheduledPatternTransitionQueueElement,
  SlowStrumTransitionQueueElement,
} from './common.ts'

export class SlowStrumPatternTransition extends Schema.TaggedClass<SlowStrumPatternTransition>()(
  'SlowStrumPatternTransition',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(
      SlowStrumTransitionQueueElement,
      ScheduledPatternTransitionQueueElement,
    ),
  },
) {
  private declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
