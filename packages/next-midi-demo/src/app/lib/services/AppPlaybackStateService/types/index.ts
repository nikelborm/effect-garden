import type { InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence } from './InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence.ts'
import type { InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToYetAnotherLoop } from './InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToYetAnotherLoop.ts'
import type { NotPlaying } from './NotPlaying.ts'
import type { PlayingLoop } from './PlayingLoop.ts'
import type { PlayingSlowStrum } from './PlayingSlowStrum.ts'
import type { ScheduledLoopToAnotherLoopTransition } from './ScheduledLoopToAnotherLoopTransition.ts'
import type { ScheduledLoopToSilenceTransition } from './ScheduledLoopToSilenceTransition.ts'
import type { ScheduledSlowStrumToLoopTransition } from './ScheduledSlowStrumToLoopTransition.ts'

export type PlayingAppPlaybackStates =
  | PlayingLoop
  | PlayingSlowStrum
  | ScheduledLoopToAnotherLoopTransition
  | ScheduledLoopToSilenceTransition
  | ScheduledSlowStrumToLoopTransition
  | InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToYetAnotherLoop
  | InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence

export type AppPlaybackState = NotPlaying | PlayingAppPlaybackStates

export type {
  InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence,
  InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToYetAnotherLoop,
  NotPlaying,
  PlayingLoop,
  PlayingSlowStrum,
  ScheduledLoopToAnotherLoopTransition,
  ScheduledLoopToSilenceTransition,
  ScheduledSlowStrumToLoopTransition,
}

export * from './common.ts'
