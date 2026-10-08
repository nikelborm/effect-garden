import type * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { AdvancePlaybackRequirements } from './AdvancePlaybackRequirements.ts'
import { PatternPatternPatternTransitionState } from './Machine/PatternPatternPatternTransition.ts'
import { PatternPatternSilenceTransitionState } from './Machine/PatternPatternSilenceTransition.ts'
import { PatternPatternTransitionState } from './Machine/PatternPatternTransition.ts'
import { PatternSilencePatternTransitionState } from './Machine/PatternSilencePatternTransition.ts'
import { PatternSilenceTransitionState } from './Machine/PatternSilenceTransition.ts'
import { PatternState } from './Machine/Pattern⏳.ts'
import { SilenceState } from './Machine/Silence🏁.ts'
import { SlowStrumState } from './Machine/SlowStrum.ts'
import { SlowStrumPatternTransitionState } from './Machine/SlowStrumPatternTransition.ts'

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
