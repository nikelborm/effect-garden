import * as Schema from 'effect/Schema'

import {
  PatternTransitionElementWithScheduledCleanup,
  PatternTransitionQueueElement,
} from './common.ts'

export class PatternPatternPatternTransition extends Schema.TaggedClass<PatternPatternPatternTransition>()(
  'PatternPatternPatternTransition',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(
      PatternTransitionElementWithScheduledCleanup,
      PatternTransitionElementWithScheduledCleanup,
      PatternTransitionQueueElement,
    ),
  },
) {
  private declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
