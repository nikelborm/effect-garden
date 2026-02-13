import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import type { AssetPointer } from '../audioAssetHelpers.ts'
import { ASSET_SIZE_BYTES } from '../constants.ts'

export class LoadedAssetSizeEstimationMap extends Effect.Service<LoadedAssetSizeEstimationMap>()(
  'next-midi-demo/LoadedAssetSizeEstimationMap',
  {
    effect: Effect.gen(function* () {
      const assetSizesActuallyPresentOnDisk = Effect.succeed(HashMap.empty())

      const assetToSizeHashMapRef = yield* Effect.flatMap(
        assetSizesActuallyPresentOnDisk,
        SubscriptionRef.make,
      )

      const getCurrentDownloadedBytes = (asset: AssetPointer) =>
        Effect.map(
          SubscriptionRef.get(assetToSizeHashMapRef),
          EFunction.flow(
            HashMap.get(asset as any as never),
            Option.getOrElse(() => 0),
          ),
        )

      const getCurrentDownloadedBytesStream = (asset: AssetPointer) =>
        Stream.map(
          assetToSizeHashMapRef.changes,
          EFunction.flow(
            HashMap.get(asset as any as never),
            Option.getOrElse(() => 0),
          ),
        )

      const getAssetFetchedSizeChangesStream = (asset: AssetPointer) =>
        assetToSizeHashMapRef.changes.pipe(
          Stream.map(
            EFunction.flow(
              HashMap.get(asset as any as never),
              Option.getOrElse(() => 0),
            ),
          ),
          Stream.changes,
        )

      const bytesToCompletionProgress = (currentBytes: number) =>
        currentBytes / ASSET_SIZE_BYTES

      const getCompletionProgressFrom0To1 = EFunction.flow(
        getCurrentDownloadedBytes,
        Effect.map(bytesToCompletionProgress),
      )

      const getAssetFetchingCompletionProgressChangesFrom0To1Stream =
        EFunction.flow(
          getAssetFetchedSizeChangesStream,
          Stream.map(bytesToCompletionProgress),
        )

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

      const areAllBytesFetched = EFunction.flow(
        getAssetFetchingCompletionStatus,
        Effect.map(({ status }) => status !== 'not finished'),
      )

      return {
        assetSizesActuallyPresentOnDisk,
        areAllBytesFetched,
        getCurrentDownloadedBytes,
        getAssetFetchedSizeChangesStream,
        getAssetFetchingCompletionProgressChangesFrom0To1Stream,
        getAssetFetchingCompletionStatusChangesStream,
        getCompletionProgressFrom0To1,
        getAssetFetchingCompletionStatus,
      }
    }),
  },
) {}

export type AssetCompletionStatus =
  | { status: 'not finished'; currentBytes: number }
  | { status: 'almost finished: fetched, but not written' }
  | { status: 'finished' }
