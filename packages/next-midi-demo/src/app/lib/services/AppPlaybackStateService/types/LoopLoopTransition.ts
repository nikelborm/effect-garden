import * as Schema from 'effect/Schema'
import {
  LoopTransitionElementWithScheduledCleanupSchema,
  LoopTransitionQueueElementSchema,
} from './common.ts'

export const LoopLoopTransitionSchema = Schema.Struct({
  _tag: Schema.Literal('LoopLoopTransition'),
  playbackStartedAtSecond: Schema.Number,
  transitionQueue: Schema.Tuple(
    LoopTransitionElementWithScheduledCleanupSchema,
    LoopTransitionQueueElementSchema,
  ),
})
export type LoopLoopTransition = Schema.Schema.Type<typeof LoopLoopTransitionSchema>
