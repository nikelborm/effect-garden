import * as HttpClient from '@effect/platform/HttpClient'
import type * as HttpClientError from '@effect/platform/HttpClientError'
import * as Effect from 'effect/Effect'
import type * as Fiber from 'effect/Fiber'
import * as FiberMap from 'effect/FiberMap'
import * as MutableHashMap from 'effect/MutableHashMap'
import * as Stream from 'effect/Stream'

import { type AssetPointer, getRemoteAssetPath } from '../audioAssetHelpers.ts'
import { MAX_PARALLEL_ASSET_DOWNLOADS } from '../constants.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import { OpfsWritableHandleManager } from './OpfsWritableHandleManager.ts'

export class DownloadManager extends Effect.Service<DownloadManager>()(
  'next-midi-demo/DownloadManager',
  {
    scoped: Effect.map(
      Effect.all({
        fiberMap: FiberMap.make<AssetPointer, void, never>(),
        estimationMap: LoadedAssetSizeEstimationMap,
      }),
      ({ fiberMap, estimationMap }) => {
        const isFiberMapFull = Effect.map(
          FiberMap.size(fiberMap),
          size => size === MAX_PARALLEL_ASSET_DOWNLOADS,
        )

        const isCurrentlyDownloading = (asset: AssetPointer) =>
          FiberMap.has(fiberMap, asset)

        const waitUntilCompletelyFree = FiberMap.awaitEmpty(fiberMap).pipe(
          Effect.withSpan('DownloadManager.waitUntilCompletelyFree'),
        )

        const startOrContinueOrIgnoreCompletedCached = Effect.fn(
          'DownloadManager.startOrContinueOrIgnoreCached',
        )(function* (asset: AssetPointer) {
          if (yield* isCurrentlyDownloading(asset))
            return {
              _tag: 'AssetIsInProgress' as const,
              message: `Asset download is in progress`,
            }

          if (yield* estimationMap.areAllBytesFetched(asset))
            return {
              _tag: 'AssetAlreadyDownloaded' as const,
              message: `All bytes to fetch the asset have been received, although might not have been written`,
            }

          if (yield* isFiberMapFull)
            return {
              _tag: 'DownloadManagerAtMaximumCapacity' as const,
              message: `It's reasonable to start download, but the limit of parallel downloads is reached`,
            }

          const fiber = yield* downloadAsset(asset).pipe(
            FiberMap.run(fiberMap, asset, { onlyIfMissing: true }),
          )

          return {
            _tag: 'StartedDownloadingAsset' as const,
            message: `Asset downloading started`,
            awaitCompletion: fiber.await,
          }
        })

        const interruptOrIgnoreNotStarted = Effect.fn(
          'DownloadManager.interruptOrIgnoreNotStarted',
        )((asset: AssetPointer) => FiberMap.remove(fiberMap, asset))

        const currentlyDownloading = Effect.withSpan(
          getFiberMapKeys(fiberMap),
          'DownloadManager.currentlyDownloading',
        )

        return {
          isFiberMapFull,
          isCurrentlyDownloading,
          currentlyDownloading,
          waitUntilCompletelyFree,
          startOrContinueOrIgnoreCompletedCached,
          interruptOrIgnoreNotStarted,
        }
      },
    ),
  },
) {}

const downloadAsset = Effect.fn('downloadAsset')(function* (
  asset: AssetPointer,
) {
  const opfs = yield* OpfsWritableHandleManager
  const remoteAssetURL = new URL(
    getRemoteAssetPath(asset),
    globalThis?.document?.location.origin,
  ).toString()

  const writeToOPFS = yield* opfs.getWriter(asset).pipe(
    Effect.catchTag('OPFSError', err =>
      Effect.dieMessage(
        'cannot download because of underlying opfs err: ' +
          err.message +
          // @ts-expect-error
          err?.cause?.message,
      ),
    ),
  )

  yield* Effect.log(`Starting download from: ${remoteAssetURL} `)

  const estimationMap = yield* LoadedAssetSizeEstimationMap

  yield* Stream.runForEach(
    getStreamOfRemoteAsset(
      asset,
      yield* estimationMap.getCurrentDownloadedBytes(asset),
    ),
    byteArray => writeToOPFS(byteArray.buffer),
  ).pipe(Effect.orDie)
})

const getStreamOfRemoteAsset = (asset: AssetPointer, resumeFromByte?: number) =>
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
  }).pipe(Effect.withSpan('getStreamOfRemoteAsset'), Stream.unwrap)

export const getFiberMapKeys = <K, A, E>(self: FiberMap.FiberMap<K, A, E>) => {
  const state = (
    self as unknown as {
      state:
        | { readonly _tag: 'Closed' }
        | {
            readonly _tag: 'Open'
            readonly backing: MutableHashMap.MutableHashMap<
              K,
              Fiber.RuntimeFiber<A, E>
            >
          }
    }
  ).state

  return Effect.sync(() =>
    state._tag === 'Closed' ? [] : MutableHashMap.keys(state.backing),
  )
}
