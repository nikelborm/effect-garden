import * as Schema from 'effect/Schema'

import { PatternTransitionElementWithScheduledCleanupSchema } from './common.ts'

export const PatternSilenceTransitionSchema = Schema.Struct({
  _tag: Schema.Literal('PatternSilenceTransition'),
  playbackStartedAtSecond: Schema.Number,
  transitionQueue: Schema.Tuple(
    PatternTransitionElementWithScheduledCleanupSchema,
  ),
})
export type PatternSilenceTransition = Schema.Schema.Type<
  typeof PatternSilenceTransitionSchema
>
