import * as Schema from 'effect/Schema'

import {
  PatternTransitionElementWithScheduledCleanupSchema,
  PatternTransitionQueueElementSchema,
} from './common.ts'

export class PatternPatternPatternTransition extends Schema.TaggedClass<PatternPatternPatternTransition>()(
  'PatternPatternPatternTransition',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(
      PatternTransitionElementWithScheduledCleanupSchema,
      PatternTransitionElementWithScheduledCleanupSchema,
      PatternTransitionQueueElementSchema,
    ),
  },
) {}
