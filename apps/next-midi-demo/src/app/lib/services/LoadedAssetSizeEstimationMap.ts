import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import { constFalse, constTrue, flow, pipe } from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Iterable from 'effect/Iterable'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as Struct from 'effect/Struct'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import type { AssetPointer } from '../brandsAndDatas/AssetPointer.ts'
import { ASSET_SIZE_BYTES } from '../constants.ts'
import {
  getAssetFromLocalFileName,
  getLocalAssetFileName,
} from '../helpers/audioAssetFileNameAndPath.ts'
import { getFileSize, listEntries } from '../opfs.ts'
import { RootDirectoryHandle } from './RootDirectoryHandle.ts'

export class LoadedAssetSizeEstimationMap extends Effect.Service<LoadedAssetSizeEstimationMap>()(
  'next-midi-demo/LoadedAssetSizeEstimationMap',
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const rootDirectoryHandle = yield* RootDirectoryHandle

      const assetToSizeHashMapRef = yield* pipe(
        listEntries(rootDirectoryHandle),
        Effect.map(
          flow(
            Iterable.filter(dirOrFileEntry => dirOrFileEntry.kind === 'file'),
            Iterable.filterMap(({ name, size }) =>
              Option.map(
                getAssetFromLocalFileName(name),
                asset =>
                  [asset, { size, verifiedOnDisk: true as boolean }] as const,
              ),
            ),
            HashMap.fromIterable,
          ),
        ),
        Effect.orDie,
        Effect.tapDefect(defectCause =>
          Effect.logError(
            'Defect while getting asset sizes actually present on disk',
            defectCause,
          ),
        ),
        Effect.flatMap(SubscriptionRef.make),
      )
      const fallbackEstimationOption = Option.getOrElse<AssetSizeEstimation>(
        () => ({ size: 0, verifiedOnDisk: false }),
      )<AssetSizeEstimation>

      const getOrDefaultBy =
        (asset: AssetPointer) => (map: AssetToSizeHashMap) =>
          map.pipe(HashMap.get(asset), fallbackEstimationOption)

      const getCurrentDownloadedBytes = (
        asset: AssetPointer,
      ): Effect.Effect<AssetSizeEstimation> =>
        Effect.map(assetToSizeHashMapRef.get, getOrDefaultBy(asset))

      const getCurrentDownloadedBytesStream = (
        asset: AssetPointer,
      ): Stream.Stream<AssetSizeEstimation> =>
        assetToSizeHashMapRef.changes.pipe(
          Stream.map(getOrDefaultBy(asset)),
          Stream.changes,
        )

      const modifyMapAt = (
        asset: AssetPointer,
        update: (estimation: AssetSizeEstimation) => AssetSizeEstimation,
      ) =>
        SubscriptionRef.update(
          assetToSizeHashMapRef,
          HashMap.modifyAt(
            asset,
            flow(fallbackEstimationOption, update, Option.some),
          ),
        )

      const increaseUnverifiedAssetSize = (
        asset: AssetPointer,
        bytesDownloaded: number,
      ) =>
        modifyMapAt(
          asset,
          Struct.evolve({
            size: size => size + bytesDownloaded,
            verifiedOnDisk: constFalse,
          }),
        )

      const verify = (asset: AssetPointer) =>
        modifyMapAt(asset, Struct.evolve({ verifiedOnDisk: constTrue }))

      const mapCurrentFetchedBytesToCompletionStatus = (asset: AssetPointer) =>
        Effect.fn('mapCurrentFetchedBytesToCompletionStatus')(function* (
          previous: AssetSizeEstimation,
        ): Effect.fn.Return<AssetCompletionStatus> {
          if (previous.size !== ASSET_SIZE_BYTES)
            return new NotFinished(previous.size)

          // Optimization to avoid UI rendering delays by skipping slow opfs
          // operations
          const sizeOnDisk = previous.verifiedOnDisk
            ? previous.size
            : yield* pipe(
                getFileSize(getLocalAssetFileName(asset)),
                Effect.provideService(RootDirectoryHandle, rootDirectoryHandle),
                Effect.catchTag('OPFSError', err =>
                  Effect.logError(
                    'OPFS Error while getting written on-disk size of asset',
                    err,
                  ).pipe(Effect.andThen(0)),
                ),
              )

          if (sizeOnDisk !== ASSET_SIZE_BYTES) return AlmostFinished

          return Finished
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

      const areAllBytesFetched = flow(
        getAssetFetchingCompletionStatus,
        Effect.map(({ status }) => status !== 'not finished'),
      )

      return {
        increaseUnverifiedAssetSize,
        verify,
        areAllBytesFetched,
        getCurrentDownloadedBytes,
        assertFinished: flow(
          getAssetFetchingCompletionStatus,
          Effect.flatMap(e =>
            e.status === 'finished'
              ? Effect.void
              : Effect.dieMessage(
                  'Assertion failed: Expected Asset download to be finished',
                ),
          ),
        ),
        getAssetFetchingCompletionStatusChangesStream,
        getAssetFetchingCompletionStatus,
      }
    }),
  },
) {}

export const AlmostFinished = Data.struct({
  status: 'almost finished: fetched, but not written' as const,
})
export type AlmostFinished = typeof AlmostFinished

export class NotFinished extends Data.Class<{
  status: 'not finished'
  currentBytes: number
}> {
  constructor(currentBytes: number) {
    super({ status: 'not finished', currentBytes })
  }
}

export const Finished = Data.struct({ status: 'finished' as const })
export type Finished = typeof Finished

export type AssetCompletionStatus = NotFinished | AlmostFinished | Finished

export interface AssetToSizeHashMap
  extends HashMap.HashMap<AssetPointer, AssetSizeEstimation> {}

export interface AssetSizeEstimation {
  readonly size: number
  readonly verifiedOnDisk: boolean
}
