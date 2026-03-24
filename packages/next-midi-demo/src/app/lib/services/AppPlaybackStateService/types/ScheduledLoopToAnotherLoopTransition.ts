import type {
  LoopTransitionElementWithScheduledCleanup,
  LoopTransitionQueueElement,
} from './common.ts'

export interface ScheduledLoopToAnotherLoopTransition {
  readonly _tag: 'ScheduledLoopToAnotherLoopTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionQueueElement,
  ]
}
