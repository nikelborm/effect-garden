import type * as Effect from 'effect/Effect'

import type { CleanupFiberToolkit } from '../types/index.ts'

export interface ReschedulePlaybackDeps {
  readonly makeCleanupFibers: (
    delayForSeconds: number,
  ) => Effect.Effect<CleanupFiberToolkit>
}
