import type { LoopTransitionElementWithScheduledCleanup } from './common.ts'

export interface LoopToLoopToSilenceTransition {
  readonly _tag: 'LoopToLoopToSilenceTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionElementWithScheduledCleanup,
  ]
}
