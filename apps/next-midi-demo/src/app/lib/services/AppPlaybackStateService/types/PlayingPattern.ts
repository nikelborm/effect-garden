import * as Schema from 'effect/Schema'

import { PatternTransitionQueueElementSchema } from './common.ts'

export const PlayingPatternSchema = Schema.Struct({
  _tag: Schema.Literal('PlayingPattern'),
  playbackStartedAtSecond: Schema.Number,
  transitionQueue: Schema.Tuple(PatternTransitionQueueElementSchema),
})
export type PlayingPattern = Schema.Schema.Type<typeof PlayingPatternSchema>
