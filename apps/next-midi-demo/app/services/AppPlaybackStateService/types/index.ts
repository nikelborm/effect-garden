import * as Schema from 'effect/Schema'

import { PatternBoundState } from './PatternBoundState/index.ts'
import { SilenceBoundState } from './SilenceBoundState/index.ts'
import { SlowStrumBoundState } from './SlowStrumBoundState/index.ts'

// The whole playback state machine collapses to two neighbouring classes: one
// whose destination is a sounding loop, one whose destination is silence. State
// migrates between them; the queue shape inside each carries the rest.
export const AppPlaybackState = Schema.Union([
  PatternBoundState,
  SilenceBoundState,
  SlowStrumBoundState,
])
export type AppPlaybackState = typeof AppPlaybackState.Type
