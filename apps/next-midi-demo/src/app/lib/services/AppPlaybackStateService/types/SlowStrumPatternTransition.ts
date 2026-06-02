import * as Schema from 'effect/Schema'

import {
  PatternTransitionQueueElementSchema,
  SlowStrumTransitionQueueElementSchema,
} from './common.ts'

export class SlowStrumPatternTransition extends Schema.TaggedClass<SlowStrumPatternTransition>()(
  'SlowStrumPatternTransition',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(
      SlowStrumTransitionQueueElementSchema,
      PatternTransitionQueueElementSchema,
    ),
  },
) {}
