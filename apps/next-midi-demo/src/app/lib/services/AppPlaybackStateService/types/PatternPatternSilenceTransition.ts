import * as Schema from 'effect/Schema'

import { PatternTransitionElementWithScheduledCleanup } from './common.ts'

export class PatternPatternSilenceTransition extends Schema.TaggedClass<PatternPatternSilenceTransition>()(
  'PatternPatternSilenceTransition',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(
      PatternTransitionElementWithScheduledCleanup,
      PatternTransitionElementWithScheduledCleanup,
    ),
  },
) {
  private declare '~brand~': never
}
