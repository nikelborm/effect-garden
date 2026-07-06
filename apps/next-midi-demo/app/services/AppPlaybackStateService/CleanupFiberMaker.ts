import * as Context from 'effect/Context'
import type * as Effect from 'effect/Effect'

import type { CleanupFiberToolkit } from './types/common.ts'
import type { DisposePlayback } from './webAudioSideEffects/index.ts'

export class CleanupFiberMaker extends Context.Tag(
  'next-midi-demo/CleanupFiberMaker',
)<
  CleanupFiberMaker,
  (
    delayForSeconds: number,
  ) => Effect.Effect<CleanupFiberToolkit, never, DisposePlayback>
>() {}
