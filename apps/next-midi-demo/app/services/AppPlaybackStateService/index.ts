import type * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { AdvancePlaybackRequirements } from './AdvancePlaybackRequirements.ts'
import { PatternState } from './PatternBound/Pattern/State.ts'
import { PatternPatternPatternTransitionState } from './PatternBound/PatternPatternPatternTransition/State.ts'
import { PatternPatternTransitionState } from './PatternBound/PatternPatternTransition/State.ts'
import { PatternSilencePatternTransitionState } from './PatternBound/PatternSilencePatternTransition/State.ts'
import { PatternPatternSilenceTransitionState } from './SilenceBound/PatternPatternSilenceTransition/State.ts'
import { PatternSilenceTransitionState } from './SilenceBound/PatternSilenceTransition/State.ts'
import { SilenceState } from './SilenceBound/Silence/State.ts'
import { SlowStrumState } from './SlowStrumBound/SlowStrum/State.ts'
import { SlowStrumPatternTransitionState } from './SlowStrumBound/SlowStrumPatternTransition/State.ts'

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
