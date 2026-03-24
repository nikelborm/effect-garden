import type { LoopTransitionElementWithScheduledCleanup } from './common.ts'

export interface ScheduledLoopToSilenceTransition {
  readonly _tag: 'ScheduledLoopToSilenceTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [LoopTransitionElementWithScheduledCleanup]
}
