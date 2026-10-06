import * as Schema from 'effect/Schema'

import { PatternQueue } from '../Pattern/Queue.ts'
import { PatternPatternPatternTransitionQueue } from '../PatternPatternPatternTransition/Queue.ts'
import { PatternPatternTransitionQueue } from '../PatternPatternTransition/Queue.ts'
import { PatternSilencePatternTransitionQueue } from '../PatternSilencePatternTransition/Queue.ts'

export const PatternBoundBaseQueue = Schema.Union([
  PatternQueue,
  PatternPatternTransitionQueue,
  PatternSilencePatternTransitionQueue,
  PatternPatternPatternTransitionQueue,
])
export type PatternBoundBaseQueue = typeof PatternBoundBaseQueue.Type
