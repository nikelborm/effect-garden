import * as Schema from 'effect/Schema'

import {
  PatternTransitionElementWithScheduledCleanup,
  PatternTransitionQueueElement,
} from './common.ts'

export class PatternPatternTransition extends Schema.TaggedClass<PatternPatternTransition>()(
  'PatternPatternTransition',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(
      PatternTransitionElementWithScheduledCleanup,
      PatternTransitionQueueElement,
    ),
  },
) {
  private declare '~brand~': never
  static override make = super.make.bind(this)
}
