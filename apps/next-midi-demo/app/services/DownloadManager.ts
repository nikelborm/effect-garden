import { pipe } from 'effect'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as FiberMap from 'effect/FiberMap'
import * as HttpClient from 'effect/http/HttpClient'
import * as HttpClientResponse from 'effect/http/HttpClientResponse'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Schedule from 'effect/Schedule'
import * as Semaphore from 'effect/Semaphore'
import * as Stream from 'effect/Stream'

import { MAX_PARALLEL_ASSET_DOWNLOADS } from '../constants.ts'
import type { AssetPointer } from '../domain/AssetPointer.ts'
import { getRemoteAssetPath } from '../helpers/audioAssetFileNameAndPath.ts'
import { getFiberMapKeys } from '../helpers/getFiberMapKeys.ts'
import { getFibersOfFiberMap } from '../helpers/getFibersOfFiberMap.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import { OpfsWritableHandleManager } from './OpfsWritableHandleManager.ts'

export class DownloadManager extends Context.Service<DownloadManager>()(
  'next-midi-demo/DownloadManager',
  {
    make: Effect.gen(function* () {
      const fiberMap = yield* FiberMap.make<AssetPointer, void, never>()
      const estimationMap = yield* LoadedAssetSizeEstimationMap
      const assetAdditionSemaphore = yield* Semaphore.make(1)

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
        let downloadAssetFiber = Option.getOrNull(
          yield* FiberMap.get(fiberMap, asset),
        )

        if (downloadAssetFiber)
          return {
            _tag: 'AssetIsInProgress' as const,
            message: `Asset download is in progress`,
            awaitCompletion: Effect.asVoid(Fiber.await(downloadAssetFiber)),
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
              Effect.flatMap(fibers => Effect.raceAll(fibers.map(Fiber.await))),
              Effect.asVoid,
            ),
          }

        downloadAssetFiber = run(asset, downloadRemainingAssetPart(asset), {
          onlyIfMissing: true,
        })

        return {
          _tag: 'StartedDownloadingAsset' as const,
          message: `Asset downloading started`,
          awaitCompletion: Effect.asVoid(Fiber.await(downloadAssetFiber)),
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

export const DownloadManagerLayer = Layer.effect(
  DownloadManager,
  DownloadManager.make,
)

const downloadRemainingAssetPart = Effect.fn(
  'DownloadManager.downloadRemainingAssetPart',
)(function* (asset: AssetPointer) {
  yield* Effect.annotateCurrentSpan({ asset })
  const opfs = yield* OpfsWritableHandleManager
  const remoteAssetURL = new URL(
    getRemoteAssetPath(asset),
    globalThis?.document?.location.origin,
  ).toString()

  yield* Effect.log(`Starting download from:`, remoteAssetURL)

  const estimationMap = yield* LoadedAssetSizeEstimationMap

  yield* Effect.gen(function* () {
    const meta = yield* Schedule.CurrentMetadata
    yield* Effect.annotateCurrentSpan({ asset, attemptIndex: meta.attempt })

    const currentBytes = yield* estimationMap.awaitVerifiedOnDiskBytes(asset)

    yield* getStreamOfRemoteAsset(asset, currentBytes).pipe(
      Stream.withSpan('DownloadManager.assetDownloadingAttemptLocalStream', {
        attributes: { asset, attemptIndex: meta.attempt },
      }),
      Stream.run(opfs.acquireFileSink(asset)),
    )
  }).pipe(
    Effect.tapCause(cause =>
      Effect.logError('Failure while downloading asset: ', cause),
    ),
    Effect.withSpan('DownloadManager.assetDownloadingAttempt'),
    Effect.retry(
      Schedule.max([Schedule.recurs(3), Schedule.exponential('1 second')]),
    ),
    Effect.withSpan('DownloadManager.assetDownload', { attributes: { asset } }),
    Effect.orDie,
  )
})

function isNonShared(
  c: Uint8Array<ArrayBufferLike>,
): c is Uint8Array<ArrayBuffer> {
  return c.buffer instanceof ArrayBuffer
}

export const getStreamOfRemoteAsset = (
  asset: AssetPointer,
  resumeFromByte?: number,
) =>
  HttpClient.get(
    getRemoteAssetPath(asset),
    resumeFromByte ? { headers: { Range: `bytes=${resumeFromByte}-` } } : {},
  ).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.withSpan('DownloadManager.getStreamOfRemoteAsset', {
      attributes: { asset, resumeFromByte: resumeFromByte ?? null },
    }),
    HttpClientResponse.stream,
    Stream.map(chunk => {
      if (!isNonShared(chunk)) throw new Error('absurd')

      return chunk
    }),
    Stream.withSpan('DownloadManager.remoteAssetContentStream', {
      attributes: { asset, resumeFromByte: resumeFromByte ?? null },
    }),
  )
