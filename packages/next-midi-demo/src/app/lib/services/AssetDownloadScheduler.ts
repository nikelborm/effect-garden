import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Fiber from 'effect/Fiber'
import * as EFunction from 'effect/Function'
import * as Ref from 'effect/Ref'
import * as Runtime from 'effect/Runtime'
import * as Stream from 'effect/Stream'

import {
  type PatternPointer,
  TaggedPatternPointer,
} from '../audioAssetHelpers.ts'
import { MAX_PARALLEL_ASSET_DOWNLOADS } from '../constants.ts'
import { getNeighborMIDIPadButtons } from '../neighborFactory.ts'
import { CurrentlySelectedAssetState } from './CurrentlySelectedAssetState.ts'
import { DownloadManager } from './DownloadManager.ts'

export class AssetDownloadScheduler extends Effect.Service<AssetDownloadScheduler>()(
  'next-midi-demo/AssetDownloadScheduler',
  {
    dependencies: [
      CurrentlySelectedAssetState.Default,
      DownloadManager.Default,
    ],
    scoped: Effect.gen(function* () {
      const currentlySelectedAsset = yield* CurrentlySelectedAssetState
      const downloadManager = yield* DownloadManager
      const runtime = yield* Effect.runtime()
      const planExecutionRef = yield* Ref.make<null | Fiber.RuntimeFiber<
        void,
        never
      >>(null)
      const scope = yield* Effect.scope
      const runFork = <A, E>(
        effect: Effect.Effect<A, E, never>,
        options?: Omit<Runtime.RunForkOptions, 'scope'> | undefined,
      ) => Runtime.runFork(runtime)(effect, { ...options, scope })

      const scheduleNewPlanExecution = Effect.fn(
        'AssetDownloadScheduler.scheduleNewPlanExecution',
      )(function* (currentlySelectedButton: PatternPointer) {
        const executionFiber = yield* planExecutionRef
        if (executionFiber) yield* Fiber.interrupt(executionFiber)
        yield* Ref.set(
          planExecutionRef,
          runFork(executeLatestPlan(currentlySelectedButton)),
        )
      })

      const executeLatestPlan = Effect.fn(
        'AssetDownloadScheduler.executeLatestPlan',
      )(function* (currentlySelectedButton: PatternPointer) {
        for (const priorityTier of priorityTiers) {
          const currentTierAssetsToDownload = getNeighborMIDIPadButtons(
            priorityTier,
            currentlySelectedButton,
          )

          const currentlyDownloading =
            yield* downloadManager.currentlyDownloading

          const currentlyDownloadingAssetsIrrelevantForThisTier =
            currentlyDownloading.filter(
              currentlyDownloadingAsset =>
                !currentTierAssetsToDownload.some(
                  Equal.equals(currentlyDownloadingAsset),
                ),
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
              while (result._tag === 'DownloadManagerAtMaximumCapacity') {
                yield* result.awaitFreeSlot
                result = yield* attemptStart
              }

              if (result._tag === 'AssetAlreadyDownloaded') return

              return yield* result.awaitCompletion
            }),
            { concurrency: MAX_PARALLEL_ASSET_DOWNLOADS, unordered: false },
          ).pipe(Stream.runDrain)
        }
      })

      EFunction.pipe(
        currentlySelectedAsset.changes,
        Stream.tap(scheduleNewPlanExecution),
        Stream.runDrain,
        runFork,
      )

      return {}
    }),
  },
) {}

const priorityTiers = [0, 1, 2, 3] as const
