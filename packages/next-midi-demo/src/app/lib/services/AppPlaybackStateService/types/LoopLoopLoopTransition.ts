import type {
  LoopTransitionElementWithScheduledCleanup,
  LoopTransitionQueueElement,
} from './common.ts'

export interface LoopLoopLoopTransition {
  readonly _tag: 'LoopLoopLoopTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionQueueElement,
  ]
}
