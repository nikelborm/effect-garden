import type { LoopLoopLoopTransition } from './LoopLoopLoopTransition.ts'
import type { LoopLoopSilenceTransition } from './LoopLoopSilenceTransition.ts'
import type { LoopLoopTransition } from './LoopLoopTransition.ts'
import type { LoopSilenceTransition } from './LoopSilenceTransition.ts'
import type { NotPlaying } from './NotPlaying.ts'
import type { PlayingLoop } from './PlayingLoop.ts'
import type { PlayingSlowStrum } from './PlayingSlowStrum.ts'
import type { SlowStrumLoopTransition } from './SlowStrumLoopTransition.ts'

export type PlayingAppPlaybackStates =
  | PlayingLoop
  | PlayingSlowStrum
  | LoopLoopTransition
  | LoopSilenceTransition
  | SlowStrumLoopTransition
  | LoopLoopSilenceTransition
  | LoopLoopLoopTransition

export type AppPlaybackState = NotPlaying | PlayingAppPlaybackStates

export type {
  LoopLoopSilenceTransition,
  LoopLoopLoopTransition,
  NotPlaying,
  PlayingLoop,
  PlayingSlowStrum,
  LoopLoopTransition,
  LoopSilenceTransition,
  SlowStrumLoopTransition,
}

export * from './common.ts'
