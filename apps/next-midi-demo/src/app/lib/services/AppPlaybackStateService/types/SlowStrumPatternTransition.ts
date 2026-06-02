import * as Schema from 'effect/Schema'

import {
  PatternTransitionQueueElementSchema,
  SlowStrumTransitionQueueElementSchema,
} from './common.ts'

export const SlowStrumPatternTransitionSchema = Schema.Struct({
  _tag: Schema.Literal('SlowStrumPatternTransition'),
  playbackStartedAtSecond: Schema.Number,
  transitionQueue: Schema.Tuple(
    SlowStrumTransitionQueueElementSchema,
    PatternTransitionQueueElementSchema,
  ),
})
export type SlowStrumPatternTransition = Schema.Schema.Type<
  typeof SlowStrumPatternTransitionSchema
>
