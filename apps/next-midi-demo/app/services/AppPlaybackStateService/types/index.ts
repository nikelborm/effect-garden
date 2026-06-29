import * as Schema from 'effect/Schema'

import { LoopBoundPlayback } from './LoopBoundPlayback.ts'
import { SilenceBoundPlayback } from './SilenceBoundPlayback.ts'

// The whole playback state machine collapses to two neighbouring classes: one
// whose destination is a sounding loop, one whose destination is silence. State
// migrates between them; the queue shape inside each carries the rest.
export const AppPlaybackState = Schema.Union(
  LoopBoundPlayback,
  SilenceBoundPlayback,
)
export type AppPlaybackState = typeof AppPlaybackState.Type
