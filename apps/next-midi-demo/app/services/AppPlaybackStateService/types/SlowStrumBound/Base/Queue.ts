import * as Schema from 'effect/Schema'

import { SlowStrumQueue } from '../SlowStrum/Queue.ts'
import { SlowStrumPatternTransitionQueue } from '../SlowStrumPatternTransition/Queue.ts'

export const SlowStrumBoundQueue = Schema.Union([
  SlowStrumQueue,
  SlowStrumPatternTransitionQueue,
])
export type SlowStrumBoundQueue = typeof SlowStrumBoundQueue.Type
