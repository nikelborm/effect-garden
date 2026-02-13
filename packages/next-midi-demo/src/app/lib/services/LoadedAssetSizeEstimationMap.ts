import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'

import type { AssetPointer } from '../audioAssetHelpers.ts'

export class LoadedAssetSizeEstimationMap extends Effect.Service<LoadedAssetSizeEstimationMap>()(
  'next-midi-demo/LoadedAssetSizeEstimationMap',
  {
    effect: Effect.gen(function* () {
      const getAssetFetchingCompletionStatusChangesStream = (
        asset: AssetPointer,
      ): Stream.Stream<AssetCompletionStatus> =>
        Stream.succeed({ status: 'finished' as const })

      return {
        getAssetFetchingCompletionStatusChangesStream,
      }
    }),
  },
) {}

export type AssetCompletionStatus =
  | { status: 'not finished'; currentBytes: number }
  | { status: 'almost finished: fetched, but not written' }
  | { status: 'finished' }
