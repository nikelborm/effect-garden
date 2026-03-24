import type { LoopTransitionElementWithScheduledCleanup } from './common.ts'

export interface LoopToSilenceTransition {
  readonly _tag: 'LoopToSilenceTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [LoopTransitionElementWithScheduledCleanup]
}
