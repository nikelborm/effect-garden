import * as Schema from 'effect/Schema'

import {
  PatternTransitionElementWithScheduledCleanupSchema,
  PatternTransitionQueueElementSchema,
} from './common.ts'

export const PatternPatternPatternTransitionSchema = Schema.Struct({
  _tag: Schema.Literal('PatternPatternPatternTransition'),
  playbackStartedAtSecond: Schema.Number,
  transitionQueue: Schema.Tuple(
    PatternTransitionElementWithScheduledCleanupSchema,
    PatternTransitionElementWithScheduledCleanupSchema,
    PatternTransitionQueueElementSchema,
  ),
})
export type PatternPatternPatternTransition = Schema.Schema.Type<
  typeof PatternPatternPatternTransitionSchema
>
