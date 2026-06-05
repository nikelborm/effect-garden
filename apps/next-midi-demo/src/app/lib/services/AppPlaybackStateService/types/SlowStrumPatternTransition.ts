import * as Schema from 'effect/Schema'

import {
  PatternTransitionQueueElement,
  SlowStrumTransitionQueueElement,
} from './common.ts'

export class SlowStrumPatternTransition extends Schema.TaggedClass<SlowStrumPatternTransition>()(
  'SlowStrumPatternTransition',
  {
    playbackStartedAtSecond: Schema.Number,
    transitionQueue: Schema.Tuple(
      SlowStrumTransitionQueueElement,
      PatternTransitionQueueElement,
    ),
  },
) {}
