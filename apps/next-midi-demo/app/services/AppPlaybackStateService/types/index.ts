import * as Schema from 'effect/Schema'

import { PatternBoundState } from './PatternBound/State.ts'
import { SilenceBoundState } from './SilenceBound/index.ts'
import { SlowStrumBoundState } from './SlowStrumBound/index.ts'

// The whole playback state machine collapses to two neighbouring classes: one
// whose destination is a sounding loop, one whose destination is silence. State
// migrates between them; the queue shape inside each carries the rest.
export const AppPlaybackState = Schema.Union([
  PatternBoundState,
  SilenceBoundState,
  SlowStrumBoundState,
])
export type AppPlaybackState = typeof AppPlaybackState.Type
