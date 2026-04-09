import * as Schema from 'effect/Schema'
import {
  LoopTransitionQueueElementSchema,
  SlowStrumTransitionQueueElementSchema,
} from './common.ts'

export const SlowStrumLoopTransitionSchema = Schema.Struct({
  _tag: Schema.Literal('SlowStrumLoopTransition'),
  playbackStartedAtSecond: Schema.Number,
  transitionQueue: Schema.Tuple(
    SlowStrumTransitionQueueElementSchema,
    LoopTransitionQueueElementSchema,
  ),
})
export type SlowStrumLoopTransition = Schema.Schema.Type<typeof SlowStrumLoopTransitionSchema>
