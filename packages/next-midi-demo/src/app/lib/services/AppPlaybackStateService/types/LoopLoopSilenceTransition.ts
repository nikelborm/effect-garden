import * as Schema from 'effect/Schema'
import { LoopTransitionElementWithScheduledCleanupSchema } from './common.ts'

export const LoopLoopSilenceTransitionSchema = Schema.Struct({
  _tag: Schema.Literal('LoopLoopSilenceTransition'),
  playbackStartedAtSecond: Schema.Number,
  transitionQueue: Schema.Tuple(
    LoopTransitionElementWithScheduledCleanupSchema,
    LoopTransitionElementWithScheduledCleanupSchema,
  ),
})
export type LoopLoopSilenceTransition = Schema.Schema.Type<typeof LoopLoopSilenceTransitionSchema>
