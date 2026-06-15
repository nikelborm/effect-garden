import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Layer from 'effect/Layer'
import * as Ref from 'effect/Ref'
import * as Stream from 'effect/Stream'
import * as Struct from 'effect/Struct'

import {
  type AssetPointer,
  complexifyAssetPointer,
  type SimpleAssetPointer,
  simplifyAssetPointer,
} from '../brandsAndDatas/AssetPointer.ts'
import { MAX_PARALLEL_ASSET_DOWNLOADS } from '../constants.ts'
import { getNeighborMIDIPadButtons } from '../helpers/getNeighborMIDIPadButtons.ts'
import { reactivelySchedule } from '../helpers/reactiveFiberScheduler.ts'
import { CurrentlySelectedAssetState } from './CurrentlySelectedAssetState.ts'
import { DownloadManager } from './DownloadManager.ts'

export const AssetDownloadSchedulerLive = Effect.gen(function* () {
  const currentlySelectedAsset = yield* CurrentlySelectedAssetState
  const downloadManager = yield* DownloadManager
  const allDownloadedRef = yield* Ref.make(false)

  const makeLogWithPriorityTier =
    (priorityTier: number) =>
    (message: string, ...rest: ReadonlyArray<any>) =>
      Effect.logDebug(`[TIER=${priorityTier}] ` + message, ...rest)

  const downloadAttempt = Effect.fn('AssetDownloadScheduler.downloadAttempt')(
    function* (priorityTier: number, simpleAsset: SimpleAssetPointer) {
      const logWithPriorityTier = makeLogWithPriorityTier(priorityTier)
      const asset: AssetPointer = complexifyAssetPointer(simpleAsset)
      const attemptStart =
        downloadManager.startOrContinueOrIgnoreCompletedCached(asset)

      let result = yield* attemptStart

      const log = (message: string) =>
        logWithPriorityTier(message, {
          downloadAttempt: Struct.pick(result, '_tag', 'message'),
          asset,
        })

      yield* log(`Attempted to start asset download`)

      while (result._tag === 'DownloadManagerAtMaximumCapacity') {
        yield* log(
          `Download manager at maximum capacity, waiting for free slot`,
        )
        yield* result.awaitFreeSlot
        yield* log(`Free slot found. Repeating attempt`)
        result = yield* attemptStart
      }

      if (result._tag === 'AssetAlreadyDownloaded') {
        yield* log(`Asset already downloaded`)
        return
      }
      yield* log(
        `Downloading slot acquired. Download started. Awaiting completion`,
      )
      yield* result.awaitCompletion

      yield* log(`Asset successfully downloaded`)

      return
    },
  )

  const downloadTier = Effect.fn('AssetDownloadScheduler.downloadTier')(
    function* (
      priorityTier: 0 | 1 | 2 | 3,
      currentlySelectedAsset: AssetPointer,
    ) {
      const logWithPriorityTier = makeLogWithPriorityTier(priorityTier)

      const currentTierAssetsToDownload: SimpleAssetPointer[] =
        getNeighborMIDIPadButtons(
          priorityTier,
          simplifyAssetPointer(currentlySelectedAsset),
        )

      yield* logWithPriorityTier(
        `Executing the latest plan for asset: `,
        currentlySelectedAsset,
      )

      const currentlyDownloading = yield* downloadManager.currentlyDownloading

      yield* logWithPriorityTier(
        `The list of assets (size=${currentlyDownloading.length}) that were downloading before`,
        { currentlySelectedAsset, currentlyDownloading },
      )

      const currentlyDownloadingAssetsIrrelevantForThisTier =
        currentlyDownloading.filter(
          currentlyDownloadingAsset =>
            !currentTierAssetsToDownload.some(
              Equal.equals(currentlyDownloadingAsset),
            ),
        )

      yield* logWithPriorityTier(
        `Irrelevant assets list (size=${currentlyDownloadingAssetsIrrelevantForThisTier.length}) to interrupt: `,
        {
          currentlySelectedAsset,
          currentlyDownloadingAssetsIrrelevantForThisTier,
        },
      )

      for (const assetToInterrupt of currentlyDownloadingAssetsIrrelevantForThisTier)
        yield* downloadManager.interruptOrIgnoreNotStarted(assetToInterrupt)

      yield* Effect.forEach(
        currentTierAssetsToDownload,
        simpleAsset => downloadAttempt(priorityTier, simpleAsset),
        { concurrency: MAX_PARALLEL_ASSET_DOWNLOADS, discard: true },
      )
    },
  )

  const executeLatestPlan = Effect.fn(
    'AssetDownloadScheduler.executeLatestPlan',
  )(function* (currentlySelectedAsset: AssetPointer) {
    if (yield* allDownloadedRef) return

    for (const priorityTier of [0, 1, 2, 3] as const)
      yield* downloadTier(priorityTier, currentlySelectedAsset)

    yield* Ref.set(allDownloadedRef, true)
  })

  yield* reactivelySchedule(
    Stream.tap(currentlySelectedAsset.changes, e =>
      Effect.log('reactively scheduled download', e),
    ),
    executeLatestPlan,
  )
}).pipe(Effect.withSpan('AssetDownloadSchedulerLive.init'), Layer.scopedDiscard)
