import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'

import type { AudioPlayback } from '../types/common.ts'
import { createPlayback, createPlaybackInContext } from './createPlayback.ts'

const withLoop = Effect.map((pb: AudioPlayback) => {
  pb.bufferSource.loop = true
  return pb
})

export const createLoopingPlayback = EFunction.flow(createPlayback, withLoop)
export const createLoopingPlaybackInContext = EFunction.flow(
  createPlaybackInContext,
  withLoop,
)
