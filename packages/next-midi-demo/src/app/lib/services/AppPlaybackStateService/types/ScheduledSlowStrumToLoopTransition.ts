import type {
  LoopTransitionQueueElement,
  SlowStrumTransitionQueueElement,
} from './common.ts'

export interface ScheduledSlowStrumToLoopTransition {
  readonly _tag: 'ScheduledSlowStrumToLoopTransition'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [
    SlowStrumTransitionQueueElement,
    LoopTransitionQueueElement,
  ]
}
