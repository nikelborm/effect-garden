import * as Schema from 'effect/Schema'

import {
  PatternTransitionElementWithScheduledCleanupSchema,
  PatternTransitionQueueElementSchema,
} from './common.ts'

export class PatternPatternTransition extends Schema.TaggedClass<PatternPatternTransition>()(
  'PatternPatternTransition',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(
      PatternTransitionElementWithScheduledCleanupSchema,
      PatternTransitionQueueElementSchema,
    ),
  },
) {}
