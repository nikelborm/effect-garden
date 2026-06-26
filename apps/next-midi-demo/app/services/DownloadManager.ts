import * as HttpClient from '@effect/platform/HttpClient'
import type * as HttpClientError from '@effect/platform/HttpClientError'
import * as Effect from 'effect/Effect'
import * as FiberMap from 'effect/FiberMap'
import * as Schedule from 'effect/Schedule'
import * as Stream from 'effect/Stream'

import { MAX_PARALLEL_ASSET_DOWNLOADS } from '../constants.ts'
import type { AssetPointer } from '../domain/AssetPointer.ts'
import { getRemoteAssetPath } from '../helpers/audioAssetFileNameAndPath.ts'
import { getFiberMapKeys } from '../helpers/getFiberMapKeys.ts'
import { getFibersOfFiberMap } from '../helpers/getFibersOfFiberMap.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import { OpfsWritableHandleManager } from './OpfsWritableHandleManager.ts'

export class DownloadManager extends Effect.Service<DownloadManager>()(
  'next-midi-demo/DownloadManager',
  {
    scoped: Effect.gen(function* () {
      const fiberMap = yield* FiberMap.make<AssetPointer, void, never>()
      const estimationMap = yield* LoadedAssetSizeEstimationMap
      const assetAdditionSemaphore = yield* Effect.makeSemaphore(1)

      const isFiberMapFull = Effect.map(
        FiberMap.size(fiberMap),
        size => size === MAX_PARALLEL_ASSET_DOWNLOADS,
      )
      const run = yield* FiberMap.runtime(fiberMap)<
        | OpfsWritableHandleManager
        | LoadedAssetSizeEstimationMap
        | HttpClient.HttpClient
      >()

      const startOrContinueOrIgnoreCompletedCached = Effect.fn(
        'DownloadManager.startOrContinueOrIgnoreCached',
      )(function* (asset: AssetPointer) {
        const effectWithDownloadFiber = FiberMap.get(fiberMap, asset)
        let downloadAssetFiber = yield* Effect.catchTag(
          effectWithDownloadFiber,
          'NoSuchElementException',
          () => Effect.succeed(null),
        )

        if (downloadAssetFiber)
          return {
            _tag: 'AssetIsInProgress' as const,
            message: `Asset download is in progress`,
            awaitCompletion: Effect.asVoid(downloadAssetFiber.await),
          }

        if (yield* estimationMap.areAllBytesFetchedAwaitVerified(asset))
          return {
            _tag: 'AssetAlreadyDownloaded' as const,
            message: `All bytes to fetch the asset have been received, although might not have been written`,
          }

        if (yield* isFiberMapFull)
          return {
            _tag: 'DownloadManagerAtMaximumCapacity' as const,
            message: `It's reasonable to start download, but the limit of parallel downloads is reached`,
            awaitFreeSlot: getFibersOfFiberMap(fiberMap).pipe(
              Effect.flatMap(fibers =>
                Effect.raceAll(fibers.map(fiber => fiber.await)),
              ),
              Effect.asVoid,
            ),
          }

        downloadAssetFiber = run(asset, downloadRemainingAssetPart(asset), {
          onlyIfMissing: true,
        })

        return {
          _tag: 'StartedDownloadingAsset' as const,
          message: `Asset downloading started`,
          awaitCompletion: Effect.asVoid(downloadAssetFiber.await),
        }
      }, assetAdditionSemaphore.withPermits(1))

      const interruptOrIgnoreNotStarted = Effect.fn(
        'DownloadManager.interruptOrIgnoreNotStarted',
      )((asset: AssetPointer) => FiberMap.remove(fiberMap, asset))

      const currentlyDownloading = Effect.withSpan(
        getFiberMapKeys(fiberMap),
        'DownloadManager.currentlyDownloading',
      )

      return {
        currentlyDownloading,
        startOrContinueOrIgnoreCompletedCached,
        interruptOrIgnoreNotStarted,
      }
    }).pipe(Effect.withSpan('DownloadManager.init')),
  },
) {}

const downloadRemainingAssetPart = Effect.fn(
  'DownloadManager.downloadRemainingAssetPart',
)(function* (asset: AssetPointer) {
  yield* Effect.annotateCurrentSpan({ asset })
  const opfs = yield* OpfsWritableHandleManager
  const remoteAssetURL = new URL(
    getRemoteAssetPath(asset),
    globalThis?.document?.location.origin,
  ).toString()

  yield* Effect.log(`Starting download from: ${remoteAssetURL} `)

  const estimationMap = yield* LoadedAssetSizeEstimationMap

  yield* Effect.gen(function* () {
    const meta = yield* Schedule.CurrentIterationMetadata
    yield* Effect.annotateCurrentSpan({ asset, attemptIndex: meta.recurrence })

    const currentBytes = yield* estimationMap.awaitVerifiedOnDiskBytes(asset)

    yield* getStreamOfRemoteAsset(asset, currentBytes).pipe(
      Stream.withSpan('DownloadManager.assetDownloadingAttemptLocalStream', {
        attributes: { asset, attemptIndex: meta.recurrence },
      }),
      Stream.run(opfs.acquireFileSink(asset)),
    )
  }).pipe(
    Effect.tapErrorCause(cause =>
      Effect.logError('Failure while downloading asset: ', cause),
    ),
    Effect.withSpan('DownloadManager.assetDownloadingAttempt'),
    Effect.retry(
      Schedule.intersect(Schedule.recurs(3), Schedule.exponential('1 second')),
    ),
    Effect.withSpan('DownloadManager.assetDownload', { attributes: { asset } }),
    Effect.orDie,
  )
})

export const getStreamOfRemoteAsset = (
  asset: AssetPointer,
  resumeFromByte?: number,
) =>
  Effect.gen(function* () {
    const client = HttpClient.filterStatusOk(yield* HttpClient.HttpClient)
    const response = yield* client.get(
      getRemoteAssetPath(asset),
      resumeFromByte ? { headers: { Range: `bytes=${resumeFromByte}-` } } : {},
    )
    return response.stream as Stream.Stream<
      Uint8Array<ArrayBuffer>,
      HttpClientError.ResponseError,
      never
    >
  }).pipe(
    Effect.withSpan('DownloadManager.getStreamOfRemoteAsset', {
      attributes: { asset, resumeFromByte: resumeFromByte ?? null },
    }),
    Stream.unwrap,
    Stream.withSpan('DownloadManager.remoteAssetContentStream', {
      attributes: { asset, resumeFromByte: resumeFromByte ?? null },
    }),
  )
