import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'

import {
  createPlayback,
  createPlaybackInContext,
  type Playback,
} from './createPlayback.ts'

const withLoop = Effect.map((pb: Playback) => {
  pb.bufferSource.loop = true
  return pb
})

export const createLoopingPlayback = EFunction.flow(createPlayback, withLoop)
export const createLoopingPlaybackInContext = EFunction.flow(
  createPlaybackInContext,
  withLoop,
)
