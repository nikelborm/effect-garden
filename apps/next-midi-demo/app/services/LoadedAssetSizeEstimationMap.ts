import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import { constant, flow, pipe } from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Iterable from 'effect/Iterable'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as Struct from 'effect/Struct'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../brandsAndDatas/AssetPointer.ts'
import { ASSET_SIZE_BYTES } from '../constants.ts'
import {
  getAssetFromLocalFileName,
  getLocalAssetFileName,
} from '../helpers/audioAssetFileNameAndPath.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { getFileSize, listEntries } from './opfs.ts'
import { PatternRegistry } from './PatternRegistry.ts'
import { RootDirectoryHandle } from './RootDirectoryHandle.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

export class LoadedAssetSizeEstimationMap extends Effect.Service<LoadedAssetSizeEstimationMap>()(
  'next-midi-demo/LoadedAssetSizeEstimationMap',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const rootDirectoryHandle = yield* RootDirectoryHandle

      const [accords, patterns, strengths] = yield* Effect.all([
        AccordRegistry.allAccords,
        PatternRegistry.allPatterns,
        StrengthRegistry.allStrengths,
      ])

      const makeEmptyAssetToSizeHashMap = (status: AssetEstimationStatus) =>
        pipe(
          Iterable.cartesian(accords, strengths),
          Iterable.flatMap(([accord, strength]) =>
            Iterable.appendAll(
              Iterable.of(TaggedSlowStrumPointer.make({ accord, strength })),
              Iterable.map(patterns, pattern =>
                TaggedPatternPointer.make({ pattern, accord, strength }),
              ),
            ),
          ),
          Iterable.map(
            asset => [asset, Data.struct({ size: 0, status })] as const,
          ),
          HashMap.fromIterable,
        )

      const assetToSizeHashMapRef = yield* SubscriptionRef.make(
        makeEmptyAssetToSizeHashMap('unknownWhileFetchingInitial'),
      )

      yield* pipe(
        listEntries(rootDirectoryHandle),
        Effect.flatMap(
          flow(
            Iterable.filter(dirOrFileEntry => dirOrFileEntry.kind === 'file'),
            Iterable.filterMap(({ name, size }) =>
              Option.map(
                getAssetFromLocalFileName(name),
                asset =>
                  [
                    asset,
                    Data.struct({
                      size,
                      status: 'presentOnDisk',
                    }) satisfies AssetSizeEstimation,
                  ] as const,
              ),
            ),
            HashMap.fromIterable,
            presentOnDiskOverrides =>
              SubscriptionRef.update(
                assetToSizeHashMapRef,
                HashMap.union(
                  HashMap.union(
                    makeEmptyAssetToSizeHashMap('absentOnDisk'),
                    presentOnDiskOverrides,
                  ),
                ),
              ).pipe(
                Effect.andThen(
                  Effect.log(
                    'received verified',
                    HashMap.toEntries(presentOnDiskOverrides).filter(
                      ([ass]) => ass.accord === 'C' && ass.strength === 'm',
                    ),
                  ),
                ),
              ),
          ),
        ),
        Effect.orDie,
        Effect.tapDefect(defectCause =>
          Effect.logError(
            'Defect while getting asset sizes actually present on disk',
            defectCause,
          ),
        ),
        Effect.forkScoped,
      )

      const getOrThrowBy = (asset: AssetPointer) => (map: AssetToSizeHashMap) =>
        map.pipe(HashMap.get(asset), Option.getOrThrow)

      const getCurrentDownloadedBytes = (
        asset: AssetPointer,
      ): Effect.Effect<AssetSizeEstimation> =>
        Effect.map(assetToSizeHashMapRef, getOrThrowBy(asset))

      const getCurrentDownloadedBytesStream = (
        asset: AssetPointer,
      ): Stream.Stream<AssetSizeEstimation> =>
        assetToSizeHashMapRef.changes.pipe(
          Stream.map(getOrThrowBy(asset)),
          Stream.changes,
        )

      const awaitVerifiedOnDiskBytes = flow(
        getCurrentDownloadedBytesStream,
        Stream.filter(({ status }) => status === 'presentOnDisk'),
        Stream.take(1),
        Stream.runHead,
        Effect.map(flow(Option.getOrThrow, ({ size }) => size)),
      )

      const modifyMapAt = (
        asset: AssetPointer,
        update: (estimation: AssetSizeEstimation) => AssetSizeEstimation,
      ) =>
        SubscriptionRef.update(
          assetToSizeHashMapRef,
          HashMap.modifyAt(
            asset,
            flow(Option.getOrThrow, update, Data.struct, Option.some),
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
            status: constant<AssetEstimationStatus>('inProgressWriter'),
          }),
        )

      const verify = (asset: AssetPointer) =>
        modifyMapAt(
          asset,
          Struct.evolve({
            status: constant<AssetEstimationStatus>('presentOnDisk'),
          }),
        )

      const mapCurrentFetchedBytesToCompletionStatus = (asset: AssetPointer) =>
        Effect.fn('mapCurrentFetchedBytesToCompletionStatus')(function* (
          previous: AssetSizeEstimation,
        ): Effect.fn.Return<AssetCompletionStatus> {
          if (previous.size !== ASSET_SIZE_BYTES)
            return new NotFinished(previous.size)

          // Optimization to avoid UI rendering delays by skipping slow opfs
          // operations
          // TODO: ensure properly handled
          const sizeOnDisk =
            previous.status === ''
              ? previous.size
              : yield* pipe(
                  getFileSize(getLocalAssetFileName(asset)),
                  Effect.provideService(
                    RootDirectoryHandle,
                    rootDirectoryHandle,
                  ),
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
        awaitVerifiedOnDiskBytes,
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
    }).pipe(Effect.withSpan('LoadedAssetSizeEstimationMap.init')),
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
  readonly status: AssetEstimationStatus
}

export type AssetEstimationStatus =
  | 'unknownWhileFetchingInitial'
  | 'absentOnDisk'
  | 'presentOnDisk'
  | 'inProgressWriter'
