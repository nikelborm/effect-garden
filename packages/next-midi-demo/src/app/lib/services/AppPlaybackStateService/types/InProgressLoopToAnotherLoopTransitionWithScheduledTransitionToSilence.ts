import type { LoopTransitionElementWithScheduledCleanup } from './common.ts'

export interface InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence {
  readonly _tag: 'InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToSilence'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionElementWithScheduledCleanup,
  ]
}
