import * as Schema from 'effect/Schema'

import { PatternState } from './Pattern/State.ts'
import { PatternPatternPatternTransitionState } from './PatternPatternPatternTransition/State.ts'
import { PatternPatternTransitionState } from './PatternPatternTransition/State.ts'
import { PatternSilencePatternTransitionState } from './PatternSilencePatternTransition/State.ts'

export const PatternBoundState = Schema.Union([
  PatternState,
  PatternPatternTransitionState,
  PatternSilencePatternTransitionState,
  PatternPatternPatternTransitionState,
])
export type PatternBoundState = typeof PatternBoundState.Type
