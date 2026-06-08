import type * as Effect from 'effect/Effect'

import type { CleanupFiberToolkit } from '../types/common.ts'

export interface AdvancePlaybackDeps {
  readonly makeCleanupFibers: (
    delayForSeconds: number,
  ) => Effect.Effect<CleanupFiberToolkit>
}
