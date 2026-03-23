import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'

import { createPlayback } from './createPlayback.ts'

export const createLoopingPlayback = EFunction.flow(
  createPlayback,
  Effect.map(pb => {
    pb.bufferSource.loop = true
    return pb
  }),
)
