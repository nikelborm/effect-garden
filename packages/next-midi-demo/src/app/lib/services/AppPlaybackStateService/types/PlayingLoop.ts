import type { LoopTransitionQueueElement } from './common.ts'

export interface PlayingLoop {
  readonly _tag: 'PlayingLoop'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [LoopTransitionQueueElement]
}
