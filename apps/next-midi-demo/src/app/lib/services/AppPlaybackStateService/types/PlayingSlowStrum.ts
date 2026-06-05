import * as Schema from 'effect/Schema'

import { SlowStrumTransitionQueueElement } from './common.ts'

export class PlayingSlowStrum extends Schema.TaggedClass<PlayingSlowStrum>()(
  'PlayingSlowStrum',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(SlowStrumTransitionQueueElement),
  },
) {}
