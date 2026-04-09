import * as Schema from 'effect/Schema'
import {
  LoopTransitionElementWithScheduledCleanupSchema,
  LoopTransitionQueueElementSchema,
} from './common.ts'

export const LoopLoopLoopTransitionSchema = Schema.Struct({
  _tag: Schema.Literal('LoopLoopLoopTransition'),
  playbackStartedAtSecond: Schema.Number,
  transitionQueue: Schema.Tuple(
    LoopTransitionElementWithScheduledCleanupSchema,
    LoopTransitionElementWithScheduledCleanupSchema,
    LoopTransitionQueueElementSchema,
  ),
})
export type LoopLoopLoopTransition = Schema.Schema.Type<typeof LoopLoopLoopTransitionSchema>
