import type { LoopTransitionElementWithScheduledCleanup } from './common.ts'

export interface LoopSilenceTransition {
  readonly _tag: 'LoopSilenceTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [LoopTransitionElementWithScheduledCleanup]
}
