import * as Schema from 'effect/Schema'

import {
  PatternTransitionElementWithScheduledCleanupSchema,
  PatternTransitionQueueElementSchema,
} from './common.ts'

export const PatternPatternTransitionSchema = Schema.Struct({
  _tag: Schema.Literal('PatternPatternTransition'),
  playbackStartedAtSecond: Schema.Number,
  transitionQueue: Schema.Tuple(
    PatternTransitionElementWithScheduledCleanupSchema,
    PatternTransitionQueueElementSchema,
  ),
})
export type PatternPatternTransition = Schema.Schema.Type<
  typeof PatternPatternTransitionSchema
>
