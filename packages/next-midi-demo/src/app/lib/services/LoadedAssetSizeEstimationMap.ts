import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Stream from 'effect/Stream'

import type { AssetPointer } from '../audioAssetHelpers.ts'
import { ASSET_SIZE_BYTES } from '../constants.ts'

export class LoadedAssetSizeEstimationMap extends Effect.Service<LoadedAssetSizeEstimationMap>()(
  'next-midi-demo/LoadedAssetSizeEstimationMap',
  {
    effect: Effect.gen(function* () {
      const getCurrentDownloadedBytes = (asset: AssetPointer) =>
        Effect.succeed(50)

      const getCurrentDownloadedBytesStream = (asset: AssetPointer) =>
        Stream.succeed(50)

      const mapCurrentFetchedBytesToCompletionStatus = (asset: AssetPointer) =>
        Effect.fn(function* (
          currentBytes: number,
        ): Effect.fn.Return<AssetCompletionStatus> {
          if (currentBytes !== ASSET_SIZE_BYTES)
            return { status: 'not finished' as const, currentBytes }

          const sizeOnDisk = yield* Effect.succeed(46)

          if (sizeOnDisk !== ASSET_SIZE_BYTES)
            return {
              status: 'almost finished: fetched, but not written' as const,
            }

          return { status: 'finished' as const }
        })

      const getAssetFetchingCompletionStatusChangesStream = (
        asset: AssetPointer,
      ) =>
        Stream.mapEffect(
          getCurrentDownloadedBytesStream(asset),
          mapCurrentFetchedBytesToCompletionStatus(asset),
        )

      const getAssetFetchingCompletionStatus = (asset: AssetPointer) =>
        Effect.flatMap(
          getCurrentDownloadedBytes(asset),
          mapCurrentFetchedBytesToCompletionStatus(asset),
        )

      return {
        getAssetFetchingCompletionStatusChangesStream,
        getAssetFetchingCompletionStatus,
      }
    }),
  },
) {}

export type AssetCompletionStatus =
  | { status: 'not finished'; currentBytes: number }
  | { status: 'almost finished: fetched, but not written' }
  | { status: 'finished' }
