import type {
  LoopTransitionElementWithScheduledCleanup,
  LoopTransitionQueueElement,
} from './common.ts'

export interface InProgressLoopToAnotherLoopTransitionWithScheduledTransitionToYetAnotherLoop {
  readonly _tag: 'InProgressLoopToAnotherLoopTransitionWithScheduledChangeToYetAnotherLoop'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionQueueElement,
  ]
}
