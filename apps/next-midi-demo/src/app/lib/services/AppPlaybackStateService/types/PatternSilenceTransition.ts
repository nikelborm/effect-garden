import * as Schema from 'effect/Schema'

import { PatternTransitionElementWithScheduledCleanup } from './common.ts'

export class PatternSilenceTransition extends Schema.TaggedClass<PatternSilenceTransition>()(
  'PatternSilenceTransition',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(
      PatternTransitionElementWithScheduledCleanup,
    ),
  },
) {}
