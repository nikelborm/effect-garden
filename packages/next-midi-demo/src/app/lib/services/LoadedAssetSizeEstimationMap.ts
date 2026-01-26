import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
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
    dependencies: [RootDirectoryHandle.Default],
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
        Ref.make,
      )

      const getCurrentDownloadedBytes = (asset: AssetPointer) =>
        Effect.map(
          Ref.get(assetToSizeHashMapRef),
          EFunction.flow(
            HashMap.get(asset),
            Option.getOrElse(() => 0),
          ),
        )

      const increaseAssetSize = (
        asset: AssetPointer,
        bytesDownloaded: number,
      ) =>
        Effect.flatMap(getCurrentDownloadedBytes(asset), previousBytes =>
          Ref.update(
            assetToSizeHashMapRef,
            HashMap.set(asset, previousBytes + bytesDownloaded),
          ),
        )

      const getCompletionProgressFrom0To1 = EFunction.flow(
        getCurrentDownloadedBytes,
        Effect.map(currentBytes => currentBytes / ASSET_SIZE_BYTES),
      )

      const getCompletionStatus = (asset: AssetPointer) =>
        Effect.flatMap(
          getCurrentDownloadedBytes(asset),
          Effect.fn(function* (currentBytes) {
            if (currentBytes !== ASSET_SIZE_BYTES)
              return 'not finished' as const
            const size = yield* getFileSize(getLocalAssetFileName(asset)).pipe(
              Effect.provideService(RootDirectoryHandle, rootDirectoryHandle),
            )
            if (size !== ASSET_SIZE_BYTES) return 'fetched, but not written'
            return 'finished'
          }),
        )

      const areAllBytesFetched = EFunction.flow(
        getCompletionStatus,
        Effect.map(status => status !== 'not finished'),
      )

      return {
        increaseAssetSize,
        assetSizesActuallyPresentOnDisk,
        areAllBytesFetched,
        getCurrentDownloadedBytes,
        getCompletionProgressFrom0To1,
        getCompletionStatus,
      }
    }),
  },
) {}
