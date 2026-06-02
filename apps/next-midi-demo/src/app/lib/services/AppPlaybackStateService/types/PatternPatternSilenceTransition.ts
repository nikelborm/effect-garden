import * as Schema from 'effect/Schema'

import { PatternTransitionElementWithScheduledCleanupSchema } from './common.ts'

export class PatternPatternSilenceTransition extends Schema.TaggedClass<PatternPatternSilenceTransition>()(
  'PatternPatternSilenceTransition',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(
      PatternTransitionElementWithScheduledCleanupSchema,
      PatternTransitionElementWithScheduledCleanupSchema,
    ),
  },
) {}
