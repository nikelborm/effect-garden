import type {
  LoopTransitionElementWithScheduledCleanup,
  LoopTransitionQueueElement,
} from './common.ts'

export interface LoopToLoopToLoopTransition {
  readonly _tag: 'LoopToLoopToLoopTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionQueueElement,
  ]
}
