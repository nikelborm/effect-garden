import * as Schema from 'effect/Schema'
import { LoopTransitionElementWithScheduledCleanupSchema } from './common.ts'

export const LoopSilenceTransitionSchema = Schema.Struct({
  _tag: Schema.Literal('LoopSilenceTransition'),
  playbackStartedAtSecond: Schema.Number,
  transitionQueue: Schema.Tuple(LoopTransitionElementWithScheduledCleanupSchema),
})
export type LoopSilenceTransition = Schema.Schema.Type<typeof LoopSilenceTransitionSchema>
