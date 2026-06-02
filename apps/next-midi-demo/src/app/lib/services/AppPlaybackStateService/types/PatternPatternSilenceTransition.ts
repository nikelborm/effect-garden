import * as Schema from 'effect/Schema'

import { PatternTransitionElementWithScheduledCleanupSchema } from './common.ts'

export const PatternPatternSilenceTransitionSchema = Schema.Struct({
  _tag: Schema.Literal('PatternPatternSilenceTransition'),
  playbackStartedAtSecond: Schema.Number,
  transitionQueue: Schema.Tuple(
    PatternTransitionElementWithScheduledCleanupSchema,
    PatternTransitionElementWithScheduledCleanupSchema,
  ),
})
export type PatternPatternSilenceTransition = Schema.Schema.Type<
  typeof PatternPatternSilenceTransitionSchema
>
