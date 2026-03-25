import type {
  LoopTransitionQueueElement,
  SlowStrumTransitionQueueElement,
} from './common.ts'

export interface SlowStrumLoopTransition {
  readonly _tag: 'SlowStrumLoopTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    SlowStrumTransitionQueueElement,
    LoopTransitionQueueElement,
  ]
}
