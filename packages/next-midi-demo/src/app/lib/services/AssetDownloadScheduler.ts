import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Runtime from 'effect/Runtime'
import * as Stream from 'effect/Stream'

import { TaggedPatternPointer } from '../audioAssetHelpers.ts'
import {
  getNeighborMIDIPadButtons,
  neighborFactory,
} from '../neighborFactory.ts'
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
      const scope = yield* Effect.scope
      const currentlySelectedAsset = yield* CurrentlySelectedAssetState
      // currentlySelectedAsset.c
      const downloadManager = yield* DownloadManager
      const runtime = yield* Effect.runtime()
      const runFork = Runtime.runFork(runtime)

      const executeLatestPlan = Effect.fn('executeLatestPlan')(
        function* (currentAsset) {
          for (const priorityTier of priorityTiers) {
            const currentTierAssetsToDownload = getNeighborMIDIPadButtons(
              priorityTier,
              currentAsset,
            )

            const asda = Stream.fromIterable(currentTierAssetsToDownload).pipe(
              Stream.mapEffect(
                asset =>
                  Effect.gen(function* () {
                    yield* Effect.yieldNow()
                    const asd =
                      downloadManager.startOrContinueOrIgnoreCompletedCached(
                        new TaggedPatternPointer(asset),
                      )
                  }),
                {
                  concurrency: 3,
                  unordered: false,
                },
              ),
            )
            // const
          }
          const currentlyDownloading =
            yield* downloadManager.currentlyDownloading

          // create new plan highest tier
          // exhaust new plan tier, removing downloaded elements up until empty
          // if successful
          // take current running
          // cleanup ready from plan
          // take the highest priority from leftover plan
          // create fiber that would take fill up download manager queue
        },
      )

      // const asd = EFunction.pipe(
      //   currentlySelectedAsset.changes,
      //   Stream.tap(
      //     // ,
      //   ),
      // )

      // Stream.runDrain

      // downloadManager.

      return {}
    }),
  },
) {}

const priorityTiers = [0, 1, 2, 3] as const
