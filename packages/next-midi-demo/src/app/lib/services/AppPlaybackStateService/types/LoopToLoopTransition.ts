import type {
  LoopTransitionElementWithScheduledCleanup,
  LoopTransitionQueueElement,
} from './common.ts'

export interface LoopToLoopTransition {
  readonly _tag: 'LoopToLoopTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    LoopTransitionElementWithScheduledCleanup,
    LoopTransitionQueueElement,
  ]
}
