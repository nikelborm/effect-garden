import * as Schema from 'effect/Schema'

import { TwoPatternsFadingToSilenceQueue } from '../PatternPatternSilenceTransition/Queue.ts'
import { PatternSilenceTransitionQueue } from '../PatternSilenceTransition/Queue.ts'
import { SilenceQueue } from '../Silence/Queue.ts'

export const SilenceBoundBaseQueue = Schema.Union([
  SilenceQueue,
  PatternSilenceTransitionQueue,
  TwoPatternsFadingToSilenceQueue,
])
export type SilenceBoundBaseQueue = typeof SilenceBoundBaseQueue.Type
