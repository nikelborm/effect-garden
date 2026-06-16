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
        defaultEstimate: ZeroLikeEstimation,
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
          Iterable.map(asset => [asset, defaultEstimate] as const),
          HashMap.fromIterable,
        )

      const assetToSizeHashMapRef = yield* SubscriptionRef.make(
        makeEmptyAssetToSizeHashMap(UndeterminedEstimation),
      )

      const initialDataFulfillmentEffect = pipe(
        listEntries(rootDirectoryHandle),
        Effect.flatMap(
          flow(
            Iterable.filter(dirOrFileEntry => dirOrFileEntry.kind === 'file'),
            Iterable.filterMap(({ name, size }) =>
              Option.map(
                getAssetFromLocalFileName(name),
                (asset): AssetToSizeHashMapEntry => [
                  asset,
                  new VerifiedPresentOnDiskEstimation(size),
                ],
              ),
            ),
            HashMap.fromIterable,
            overrides =>
              HashMap.union(
                makeEmptyAssetToSizeHashMap(VerifiedAbsentOnDiskEstimation),
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
        Effect.withSpan('LoadedAssetSizeEstimationMap.initialDataFulfillment'),
      )

      yield* Effect.forkScoped(initialDataFulfillmentEffect)

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
          Stream.withSpan(
            'LoadedAssetSizeEstimationMap.currentDownloadedBytesStream',
            { attributes: { asset } },
          ),
        )

      const awaitVerified = (asset: AssetPointer) =>
        assetToSizeHashMapRef.changes.pipe(
          Stream.map(getOrThrowBy(asset)),
          Stream.filter(isVerified),
          Stream.take(1),
          Stream.runHead,
          Effect.map(Option.getOrThrow),
          Effect.withSpan('LoadedAssetSizeEstimationMap.awaitVerified', {
            attributes: { asset },
          }),
        )

      const awaitVerifiedOnDiskBytes = flow(
        awaitVerified,
        Effect.map(estimate =>
          estimate.status === 'verifiedAbsentOnDisk' ? 0 : estimate.size,
        ),
      )

      const modifyMapAt = (
        asset: AssetPointer,
        update: (estimation: AssetSizeEstimation) => AssetSizeEstimation,
      ) =>
        assetToSizeHashMapRef.pipe(
          SubscriptionRef.updateAndGet(
            HashMap.modifyAt(
              asset,
              // I deliberately avoid HashMap.modify, and choose Option.getOrThrow
              // approach instead to enforce invariant, which isn't inforced in
              // the other, which just Option.map's over the value
              flow(Option.getOrThrow, update, Option.some),
            ),
          ),
          Effect.tap(newMap =>
            Effect.annotateLogs(Effect.log('Modified estimationMap'), {
              newValue: HashMap.unsafeGet(newMap, asset),
              asset,
            }),
          ),
          Effect.asVoid,
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
          return new InProgressWriteEstimation(
            estimation.size + bytesDownloaded,
          )
        })

      const setVerified = (asset: AssetPointer, size: number) =>
        modifyMapAt(asset, () => new VerifiedPresentOnDiskEstimation(size))

      const verify = (asset: AssetPointer) =>
        modifyMapAt(asset, estimation => {
          if (isAbsentOrUnknown(estimation))
            throw new Error(
              'Assertion failed: Cannot verify size of absent asset',
            )
          return new VerifiedPresentOnDiskEstimation(estimation.size)
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

      const areAllBytesFetchedAwaitVerified = flow(
        awaitVerified,
        Effect.map(
          estimation =>
            estimation.status === 'verifiedPresentOnDisk' &&
            estimation.size === ASSET_SIZE_BYTES,
        ),
      )

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

export const VerifiedAbsentOnDiskEstimation = Data.struct({
  status: 'verifiedAbsentOnDisk',
} as const)
export type VerifiedAbsentOnDiskEstimation =
  typeof VerifiedAbsentOnDiskEstimation

export const UndeterminedEstimation = Data.struct({
  status: 'unknownWhileFetchingInitial',
} as const)
export type UndeterminedEstimation = typeof UndeterminedEstimation

export class InProgressWriteEstimation extends Data.Class<{
  status: 'inProgressWriter'
  size: number
}> {
  constructor(size: number) {
    super({ status: 'inProgressWriter', size })
  }
}

export class VerifiedPresentOnDiskEstimation extends Data.Class<{
  status: 'verifiedPresentOnDisk'
  size: number
}> {
  constructor(size: number) {
    super({ status: 'verifiedPresentOnDisk', size })
  }
}

export type VerifiedEstimation =
  | VerifiedPresentOnDiskEstimation
  | VerifiedAbsentOnDiskEstimation

export type FilePresentEstimation =
  | InProgressWriteEstimation
  | VerifiedPresentOnDiskEstimation

export type ZeroLikeEstimation =
  | VerifiedAbsentOnDiskEstimation
  | UndeterminedEstimation

export type AssetSizeEstimation =
  | VerifiedAbsentOnDiskEstimation
  | UndeterminedEstimation
  | InProgressWriteEstimation
  | VerifiedPresentOnDiskEstimation

const isAbsentOrUnknown = (a: AssetSizeEstimation): a is ZeroLikeEstimation =>
  a.status === 'verifiedAbsentOnDisk' ||
  a.status === 'unknownWhileFetchingInitial'

const isVerified = (a: AssetSizeEstimation): a is VerifiedEstimation =>
  a.status === 'verifiedPresentOnDisk' || a.status === 'verifiedAbsentOnDisk'

export type AssetEstimationStatus = AssetSizeEstimation['status']
