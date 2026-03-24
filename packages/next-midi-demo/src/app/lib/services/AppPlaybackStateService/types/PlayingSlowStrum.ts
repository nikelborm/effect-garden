import type { SlowStrumTransitionQueueElement } from './common.ts'

export interface PlayingSlowStrum {
  readonly _tag: 'PlayingSlowStrum'
  readonly playbackStartedAtSecond: number
  readonly transitionQueue: readonly [SlowStrumTransitionQueueElement]
}
