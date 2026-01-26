import * as Effect from 'effect/Effect'

import { CurrentlySelectedAssetState } from './CurrentlySelectedAssetState.ts'
import { DownloadManager } from './DownloadManager.ts'

export class AssetDownloadScheduler extends Effect.Service<AssetDownloadScheduler>()(
  'next-midi-demo/AssetDownloadScheduler',
  {
    dependencies: [
      CurrentlySelectedAssetState.Default,
      DownloadManager.Default,
    ],
    effect: Effect.gen(function* () {
      const currentlySelectedAsset = yield* CurrentlySelectedAssetState
      const downloadManager = yield* DownloadManager

      // downloadManager.

      return {}
    }),
  },
) {}
