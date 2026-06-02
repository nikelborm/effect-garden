import * as Schema from 'effect/Schema'

import { SlowStrumTransitionQueueElementSchema } from './common.ts'

export class PlayingSlowStrum extends Schema.TaggedClass<PlayingSlowStrum>()(
  'PlayingSlowStrum',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(SlowStrumTransitionQueueElementSchema),
  },
) {}
