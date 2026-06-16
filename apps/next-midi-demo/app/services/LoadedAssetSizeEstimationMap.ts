import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import { flow, pipe } from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Iterable from 'effect/Iterable'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../brandsAndDatas/AssetPointer.ts'
import { ASSET_SIZE_BYTES } from '../constants.ts'
import { getAssetFromLocalFileName } from '../helpers/audioAssetFileNameAndPath.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { listEntries } from './opfs.ts'
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

      const makeEmptyAssetToSizeHashMap = (
        defaultEstimate: AbsentEstimation,
      ): AssetToSizeHashMap =>
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
            (asset): AssetToSizeHashMapEntry => [
              asset,
              Data.struct(defaultEstimate),
            ],
          ),
          HashMap.fromIterable,
        )

      const assetToSizeHashMapRef = yield* SubscriptionRef.make(
        makeEmptyAssetToSizeHashMap({ status: 'unknownWhileFetchingInitial' }),
      )

      yield* pipe(
        listEntries(rootDirectoryHandle),
        Effect.flatMap(
          flow(
            Iterable.filter(dirOrFileEntry => dirOrFileEntry.kind === 'file'),
            Iterable.filterMap(({ name, size }) =>
              Option.map(
                getAssetFromLocalFileName(name),
                (asset): AssetToSizeHashMapEntry => [
                  asset,
                  Data.struct({ size, status: 'verifiedOnDisk' }),
                ],
              ),
            ),
            HashMap.fromIterable,
            overrides =>
              HashMap.union(
                makeEmptyAssetToSizeHashMap({ status: 'absentOnDisk' }),
                overrides,
              ),
            map => SubscriptionRef.set(assetToSizeHashMapRef, map),
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

      const awaitVerifiedOnDiskBytes = (asset: AssetPointer) =>
        assetToSizeHashMapRef.changes.pipe(
          Stream.map(getOrThrowBy(asset)),
          Stream.filter(
            (estimate): estimate is PresentEstimation =>
              estimate.status === 'verifiedOnDisk' ||
              estimate.status === 'absentOnDisk',
          ),
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
            // I conciously avoid modify, and choose getOrThrow instead to
            // enforce invariant, which HashMap.modify doesn't inforce because
            // it just Option.map's over the value
            flow(Option.getOrThrow, update, Data.struct, Option.some),
          ),
        )

      const increaseAndUnverifyAssetSize = (
        asset: AssetPointer,
        bytesDownloaded: number,
      ) =>
        modifyMapAt(asset, estimation => {
          if (isAbsentOrUnknown(estimation))
            throw new Error(
              'Assertion failed: Cannot increase the size of absent asset',
            )
          return {
            status: 'inProgressWriter',
            size: estimation.size + bytesDownloaded,
          }
        })

      const setVerified = (asset: AssetPointer, size: number) =>
        modifyMapAt(asset, () => ({ status: 'inProgressWriter', size }))

      const verify = (asset: AssetPointer) =>
        modifyMapAt(asset, estimation => {
          if (isAbsentOrUnknown(estimation))
            throw new Error(
              'Assertion failed: Cannot verify size of absent asset',
            )
          return { status: 'verifiedOnDisk', size: estimation.size }
        })

      const mapCurrentFetchedBytesToCompletionStatus = (
        previous: AssetSizeEstimation,
      ): AssetCompletionStatus => {
        if (isAbsentOrUnknown(previous)) return new NotFinished(0)

        if (previous.size !== ASSET_SIZE_BYTES)
          return new NotFinished(previous.size)

        if (previous.status === 'inProgressWriter') return AlmostFinished

        return Finished
      }

      const getAssetFetchingCompletionStatusChangesStream = (
        asset: AssetPointer,
      ) =>
        Stream.map(
          getCurrentDownloadedBytesStream(asset),
          mapCurrentFetchedBytesToCompletionStatus,
        )

      const getAssetFetchingCompletionStatus = (asset: AssetPointer) =>
        Effect.map(
          getCurrentDownloadedBytes(asset),
          mapCurrentFetchedBytesToCompletionStatus,
        )

      const areAllBytesFetchedAwaitVerified = (
        asset: AssetPointer,
      ): Effect.Effect<boolean> => {
        return Effect.succeed(true)
      }

      const areAllBytesFetched = flow(
        getAssetFetchingCompletionStatus,
        Effect.map(({ status }) => status !== 'not finished'),
      )

      return {
        increaseAndUnverifyAssetSize,
        verify,
        setVerified,
        areAllBytesFetchedAwaitVerified,
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
export type AssetToSizeHashMapEntry = [AssetPointer, AssetSizeEstimation]

export interface AbsentEstimation {
  readonly status: AbsentStatus
}
export interface PresentEstimation {
  readonly size: number
  readonly status: PresentStatus
}

export type AssetSizeEstimation = AbsentEstimation | PresentEstimation

const isAbsentOrUnknown = (a: AssetSizeEstimation): a is AbsentEstimation =>
  a.status === 'absentOnDisk' || a.status === 'unknownWhileFetchingInitial'
export type PresentStatus = 'verifiedOnDisk' | 'inProgressWriter'
export type AbsentStatus = 'unknownWhileFetchingInitial' | 'absentOnDisk'

export type AssetEstimationStatus = PresentStatus | AbsentStatus
