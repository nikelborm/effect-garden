import * as Schema from 'effect/Schema'
import { SlowStrumTransitionQueueElementSchema } from './common.ts'

export const PlayingSlowStrumSchema = Schema.Struct({
  _tag: Schema.Literal('PlayingSlowStrum'),
  playbackStartedAtSecond: Schema.Number,
  transitionQueue: Schema.Tuple(SlowStrumTransitionQueueElementSchema),
})
export type PlayingSlowStrum = Schema.Schema.Type<typeof PlayingSlowStrumSchema>
