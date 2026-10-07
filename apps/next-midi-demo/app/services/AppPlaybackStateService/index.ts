import type * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { AdvancePlaybackRequirements } from './AdvancePlaybackRequirements.ts'
import { PatternState } from './Machine/Pattern/State.ts'
import { PatternPatternPatternTransitionState } from './Machine/PatternPatternPatternTransition/State.ts'
import { PatternPatternSilenceTransitionState } from './Machine/PatternPatternSilenceTransition/State.ts'
import { PatternPatternTransitionState } from './Machine/PatternPatternTransition/State.ts'
import { PatternSilencePatternTransitionState } from './Machine/PatternSilencePatternTransition/State.ts'
import { PatternSilenceTransitionState } from './Machine/PatternSilenceTransition/State.ts'
import { SilenceState } from './Machine/Silence/State.ts'
import { SlowStrumState } from './Machine/SlowStrum/State.ts'
import { SlowStrumPatternTransitionState } from './Machine/SlowStrumPatternTransition/State.ts'

// The whole playback state machine collapses to two neighbouring classes: one
// whose destination is a sounding loop, one whose destination is silence. State
// migrates between them; the queue shape inside each carries the rest.
export const AppPlaybackState = Schema.Union([
  PatternState,
  PatternPatternTransitionState,
  PatternSilencePatternTransitionState,
  PatternPatternPatternTransitionState,

  SilenceState,
  PatternSilenceTransitionState,
  PatternPatternSilenceTransitionState,

  SlowStrumState,
  SlowStrumPatternTransitionState,
])
export type AppPlaybackState = typeof AppPlaybackState.Type

export interface AdvanceFnReturn
  extends Effect.gen.Return<
    AppPlaybackState,
    never,
    AdvancePlaybackRequirements
  > {}
