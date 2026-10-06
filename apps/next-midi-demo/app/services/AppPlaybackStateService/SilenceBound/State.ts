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
