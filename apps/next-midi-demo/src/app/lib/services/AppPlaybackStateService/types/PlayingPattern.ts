import * as Schema from 'effect/Schema'

import { PatternTransitionQueueElementSchema } from './common.ts'

export class PlayingPattern extends Schema.TaggedClass<PlayingPattern>()(
  'PlayingPattern',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(PatternTransitionQueueElementSchema),
  },
) {}
