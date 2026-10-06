import * as Schema from 'effect/Schema'

import { PatternPatternSilenceTransitionState } from './PatternPatternSilenceTransition/State.ts'
import { PatternSilenceTransitionState } from './PatternSilenceTransition/State.ts'
import { SilenceState } from './Silence/State.ts'

export const SilenceBoundState = Schema.Union([
  SilenceState,
  PatternSilenceTransitionState,
  PatternPatternSilenceTransitionState,
])
export type SilenceBoundState = typeof SilenceBoundState.Type

export * from './PatternPatternSilenceTransition/Queue.ts'
export * from './PatternPatternSilenceTransition/State.ts'
export * from './PatternSilenceTransition/Queue.ts'
export * from './PatternSilenceTransition/State.ts'
export * from './Silence/Queue.ts'
export * from './Silence/State.ts'
export * from './SilenceBoundStateBase.ts'
