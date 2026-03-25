import type { LoopTransitionElementWithScheduledCleanup } from './common.ts'

export interface LoopLoopSilenceTransition {
  readonly _tag: 'LoopLoopSilenceTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionElementWithScheduledCleanup,
  ]
}
