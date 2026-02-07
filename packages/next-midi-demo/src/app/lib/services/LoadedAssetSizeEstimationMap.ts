import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'
import type * as Types from 'effect/Types'

import {
  type AssetPointer,
  getAssetFromLocalFileName,
  getLocalAssetFileName,
} from '../audioAssetHelpers.ts'
import { ASSET_SIZE_BYTES } from '../constants.ts'
import { getFileSize, listEntries } from '../opfs.ts'
import { RootDirectoryHandle } from './RootDirectoryHandle.ts'

export class LoadedAssetSizeEstimationMap extends Effect.Service<LoadedAssetSizeEstimationMap>()(
  'next-midi-demo/LoadedAssetSizeEstimationMap',
  {
    effect: Effect.gen(function* () {
      const rootDirectoryHandle = yield* RootDirectoryHandle
      const assetSizesActuallyPresentOnDisk = Effect.map(
        listEntries(rootDirectoryHandle),
        EFunction.flow(
          EArray.filter(e => e.kind === 'file'),
          EArray.filterMap(fileEntry =>
            Option.map(
              getAssetFromLocalFileName(fileEntry.name),
              asset => [asset, fileEntry.size] satisfies Types.TupleOf<2, any>,
            ),
          ),
          HashMap.fromIterable,
        ),
      ).pipe(Effect.orDie)

      const assetToSizeHashMapRef = yield* Effect.flatMap(
        assetSizesActuallyPresentOnDisk,
        SubscriptionRef.make,
      )

      const getCurrentDownloadedBytes = (asset: AssetPointer) =>
        Effect.map(
          SubscriptionRef.get(assetToSizeHashMapRef),
          EFunction.flow(
            HashMap.get(asset),
            Option.getOrElse(() => 0),
          ),
        )

      const getAssetFetchedSizeChangesStream = (asset: AssetPointer) =>
        assetToSizeHashMapRef.changes.pipe(
          Stream.map(
            EFunction.flow(
              HashMap.get(asset),
              Option.getOrElse(() => 0),
            ),
          ),
          Stream.changes,
        )

      const increaseAssetSize = (
        asset: AssetPointer,
        bytesDownloaded: number,
      ) =>
        SubscriptionRef.update(
          assetToSizeHashMapRef,
          HashMap.modifyAt(
            asset,
            EFunction.flow(
              Option.orElse(() => Option.some(0)),
              Option.map(previousBytes => previousBytes + bytesDownloaded),
            ),
          ),
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
        Effect.fn(function* (currentBytes: number) {
          if (currentBytes !== ASSET_SIZE_BYTES) return 'not finished' as const

          const size = yield* getFileSize(getLocalAssetFileName(asset)).pipe(
            Effect.provideService(RootDirectoryHandle, rootDirectoryHandle),
          )

          if (size !== ASSET_SIZE_BYTES) return 'fetched, but not written'

          return 'finished'
        })

      const getAssetFetchingCompletionStatusChangesStream = (
        asset: AssetPointer,
      ) =>
        Stream.mapEffect(
          getCurrentDownloadedBytes(asset),
          mapCurrentFetchedBytesToCompletionStatus(asset),
        )

      const getAssetFetchingCompletionStatus = (asset: AssetPointer) =>
        Effect.flatMap(
          getCurrentDownloadedBytes(asset),
          mapCurrentFetchedBytesToCompletionStatus(asset),
        )

      const areAllBytesFetched = EFunction.flow(
        getAssetFetchingCompletionStatus,
        Effect.map(status => status !== 'not finished'),
      )

      return {
        increaseAssetSize,
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
