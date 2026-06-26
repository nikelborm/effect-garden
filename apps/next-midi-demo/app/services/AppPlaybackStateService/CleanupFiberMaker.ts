import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

import type { CleanupFiberToolkit } from './types/common.ts'

// The element lifecycle methods (see ./types/loopElements.ts) arm cleanup fibers
// from inside Effect context instead of receiving a `makeCleanupFibers` closure
// as an argument. The factory still closes over the state ref (so it can collapse
// the very state that holds the element), so it can't be a static Layer — it is
// provided per-run by AppPlaybackStateService, where the state ref exists.
export class CleanupFiberMaker extends Context.Tag(
  'next-midi-demo/CleanupFiberMaker',
)<
  CleanupFiberMaker,
  (delayForSeconds: number) => Effect.Effect<CleanupFiberToolkit>
>() {}
