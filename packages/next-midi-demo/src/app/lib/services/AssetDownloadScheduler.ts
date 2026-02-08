import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Stream from 'effect/Stream'
import * as Struct from 'effect/Struct'

import {
  type PatternPointer,
  TaggedPatternPointer,
} from '../audioAssetHelpers.ts'
import { MAX_PARALLEL_ASSET_DOWNLOADS } from '../constants.ts'
import { getNeighborMIDIPadButtons } from '../helpers/getNeighborMIDIPadButtons.ts'
import { reactivelySchedule } from '../helpers/reactiveFiberScheduler.ts'
import { CurrentlySelectedAssetState } from './CurrentlySelectedAssetState.ts'
import { DownloadManager } from './DownloadManager.ts'

export class AssetDownloadScheduler extends Effect.Service<AssetDownloadScheduler>()(
  'next-midi-demo/AssetDownloadScheduler',
  {
    scoped: Effect.gen(function* () {
      const currentlySelectedAsset = yield* CurrentlySelectedAssetState
      const downloadManager = yield* DownloadManager

      const executeLatestPlan = Effect.fn(
        'AssetDownloadScheduler.executeLatestPlan',
      )(function* (currentlySelectedAsset: PatternPointer) {
        for (const priorityTier of priorityTiers) {
          const logWithPriorityTier = (
            message: string,
            ...rest: ReadonlyArray<any>
          ) => Effect.log(`[TIER=${priorityTier}] ` + message, ...rest)

          const currentTierAssetsToDownload = getNeighborMIDIPadButtons(
            priorityTier,
            currentlySelectedAsset,
          )

          yield* logWithPriorityTier(
            `Executing the latest plan for asset: `,
            currentlySelectedAsset,
          )

          const currentlyDownloading =
            yield* downloadManager.currentlyDownloading

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

          yield* Stream.mapEffect(
            Stream.fromIterable(currentTierAssetsToDownload),
            Effect.fn(function* (asset: PatternPointer) {
              const attemptStart = downloadManager
                .startOrContinueOrIgnoreCompletedCached(
                  new TaggedPatternPointer(asset),
                )
                .pipe(Effect.orDie)

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
              yield* Effect.log(`Asset successfully downloaded`, asset)
              return
            }),
            { concurrency: MAX_PARALLEL_ASSET_DOWNLOADS, unordered: true },
          ).pipe(Stream.runDrain)
        }
      })

      yield* reactivelySchedule(
        Stream.tap(
          Stream.map(
            currentlySelectedAsset.changes,
            ({
              accord: { index: accordIndex },
              pattern: { index: patternIndex },
              strength,
            }) => ({ accordIndex, patternIndex, strength }),
          ),
          e => Effect.log('reactively scheduled download', e),
        ),
        executeLatestPlan,
      )

      return {}
    }),
  },
) {}

const priorityTiers = [0, 1, 2, 3] as const
