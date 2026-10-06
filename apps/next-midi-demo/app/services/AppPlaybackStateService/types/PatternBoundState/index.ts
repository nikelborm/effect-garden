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

export * from './Pattern/Queue.ts'
export * from './Pattern/State.ts'
export * from './PatternBoundStateBase.ts'
export * from './PatternPatternPatternTransition/Queue.ts'
export * from './PatternPatternPatternTransition/State.ts'
export * from './PatternPatternTransition/Queue.ts'
export * from './PatternPatternTransition/State.ts'
export * from './PatternSilencePatternTransition/Queue.ts'
export * from './PatternSilencePatternTransition/State.ts'
