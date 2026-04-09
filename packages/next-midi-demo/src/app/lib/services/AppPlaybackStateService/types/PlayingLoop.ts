import * as Schema from 'effect/Schema'
import { LoopTransitionQueueElementSchema } from './common.ts'

export const PlayingLoopSchema = Schema.Struct({
  _tag: Schema.Literal('PlayingLoop'),
  playbackStartedAtSecond: Schema.Number,
  transitionQueue: Schema.Tuple(LoopTransitionQueueElementSchema),
})
export type PlayingLoop = Schema.Schema.Type<typeof PlayingLoopSchema>
