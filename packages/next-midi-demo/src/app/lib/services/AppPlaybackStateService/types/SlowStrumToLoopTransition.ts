import type {
  LoopTransitionQueueElement,
  SlowStrumTransitionQueueElement,
} from './common.ts'

export interface SlowStrumToLoopTransition {
  readonly _tag: 'SlowStrumToLoopTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    SlowStrumTransitionQueueElement,
    LoopTransitionQueueElement,
  ]
}
