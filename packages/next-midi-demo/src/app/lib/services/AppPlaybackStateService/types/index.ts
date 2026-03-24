import type { LoopToLoopToLoopTransition } from './LoopToLoopToLoopTransition.ts'
import type { LoopToLoopToSilenceTransition } from './LoopToLoopToSilenceTransition.ts'
import type { LoopToLoopTransition } from './LoopToLoopTransition.ts'
import type { LoopToSilenceTransition } from './LoopToSilenceTransition.ts'
import type { NotPlaying } from './NotPlaying.ts'
import type { PlayingLoop } from './PlayingLoop.ts'
import type { PlayingSlowStrum } from './PlayingSlowStrum.ts'
import type { SlowStrumToLoopTransition } from './SlowStrumToLoopTransition.ts'

export type PlayingAppPlaybackStates =
  | PlayingLoop
  | PlayingSlowStrum
  | LoopToLoopTransition
  | LoopToSilenceTransition
  | SlowStrumToLoopTransition
  | LoopToLoopToSilenceTransition
  | LoopToLoopToLoopTransition

export type AppPlaybackState = NotPlaying | PlayingAppPlaybackStates

export type {
  LoopToLoopToSilenceTransition,
  LoopToLoopToLoopTransition,
  NotPlaying,
  PlayingLoop,
  PlayingSlowStrum,
  LoopToLoopTransition,
  LoopToSilenceTransition,
  SlowStrumToLoopTransition,
}

export * from './common.ts'
