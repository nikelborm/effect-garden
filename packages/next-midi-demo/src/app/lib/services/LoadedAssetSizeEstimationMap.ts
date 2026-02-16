import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Iterable from 'effect/Iterable'
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

      const assetSizesActuallyPresentOnDisk: Effect.Effect<AssetToSizeHashMap> =
        Effect.map(
          listEntries(rootDirectoryHandle),
          EFunction.flow(
            Iterable.filter(e => e.kind === 'file'),
            Iterable.filterMap(fileEntry =>
              Option.map(
                getAssetFromLocalFileName(fileEntry.name),
                asset =>
                  [
                    asset,
                    {
                      size: fileEntry.size,
                      verifiedOnDisk: true,
                    },
                  ] satisfies Types.TupleOf<2, any>,
              ),
            ),
            HashMap.fromIterable,
          ),
        ).pipe(
          Effect.orDie,
          Effect.tapDefect(defectCause =>
            Effect.logError(
              'Defect while getting asset sizes actually present on disk',
              defectCause,
            ),
          ),
        )

      const assetToSizeHashMapRef = yield* Effect.flatMap(
        assetSizesActuallyPresentOnDisk,
        SubscriptionRef.make,
      )

      const getCurrentDownloadedBytes = (asset: AssetPointer) =>
        Effect.map(
          assetToSizeHashMapRef.get,
          EFunction.flow(
            HashMap.get(asset),
            Option.getOrElse(() => ({
              size: 0,
              verifiedOnDisk: false as boolean,
            })),
          ),
        )

      const getCurrentDownloadedBytesStream = (asset: AssetPointer) =>
        assetToSizeHashMapRef.changes.pipe(
          Stream.map(
            EFunction.flow(
              HashMap.get(asset),
              Option.getOrElse(() => ({
                size: 0,
                verifiedOnDisk: false as boolean,
              })),
            ),
          ),
          // Stream.changes,
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
              Option.orElseSome(() => ({ size: 0 })),
              Option.map(previous => ({
                size: previous.size + bytesDownloaded,
                verifiedOnDisk: false as boolean,
              })),
            ),
          ),
        )

      const verify = (asset: AssetPointer) =>
        SubscriptionRef.update(
          assetToSizeHashMapRef,
          HashMap.modifyAt(
            asset,
            EFunction.flow(
              Option.orElseSome(() => ({ size: 0 })),
              Option.map(previous => ({
                ...previous,
                verifiedOnDisk: true as boolean,
              })),
            ),
          ),
        )

      const mapCurrentFetchedBytesToCompletionStatus = (asset: AssetPointer) =>
        Effect.fn(function* (previous: {
          size: number
          verifiedOnDisk: boolean
        }): Effect.fn.Return<AssetCompletionStatus> {
          if (previous.size !== ASSET_SIZE_BYTES)
            return {
              status: 'not finished' as const,
              currentBytes: previous.size,
            }

          // Optimization to avoid UI rendering delays by skipping slow opfs
          // operations
          const sizeOnDisk = previous.verifiedOnDisk
            ? previous.size
            : yield* EFunction.pipe(
                getFileSize(getLocalAssetFileName(asset)),
                Effect.provideService(RootDirectoryHandle, rootDirectoryHandle),
                Effect.catchTag('OPFSError', err =>
                  Effect.logError(
                    'OPFS Error while getting written on-disk size of asset',
                    err,
                  ).pipe(Effect.andThen(0)),
                ),
              )

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
        increaseAssetSize,
        verify,
        areAllBytesFetched,
        getCurrentDownloadedBytes,
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

interface AssetToSizeHashMap
  extends HashMap.HashMap<
    AssetPointer,
    { size: number; verifiedOnDisk: boolean }
  > {}
