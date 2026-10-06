import * as Schema from 'effect/Schema'

import {
  ScheduledPatternTransitionQueueElement,
  SlowStrumTransitionQueueElement,
} from '../../common.ts'

export const SlowStrumPatternTransitionQueue = Schema.Tuple([
  SlowStrumTransitionQueueElement,
  ScheduledPatternTransitionQueueElement,
])
export const isSlowStrumPatternTransitionQueue = Schema.is(
  SlowStrumPatternTransitionQueue,
)
