import * as Effect from 'effect/Effect'
import * as Ref from 'effect/Ref'
import * as Stream from 'effect/Stream'

import type { PatternPointer } from '../audioAssetHelpers.ts'
import { reactivelySchedule } from '../helpers/reactiveFiberScheduler.ts'
import { CurrentlySelectedAssetState } from './CurrentlySelectedAssetState.ts'

export class AssetDownloadScheduler extends Effect.Service<AssetDownloadScheduler>()(
  'next-midi-demo/AssetDownloadScheduler',
  {
    scoped: Effect.gen(function* () {
      const currentlySelectedAsset = yield* CurrentlySelectedAssetState
      const allDownloadedRef = yield* Ref.make(true)

      const executeLatestPlan = Effect.fn(
        'AssetDownloadScheduler.executeLatestPlan',
      )(function* (currentlySelectedAsset: PatternPointer) {
        if (yield* allDownloadedRef) return
      })

      yield* reactivelySchedule(
        Stream.tap(
          Stream.map(currentlySelectedAsset.changes, ({ strength }) => ({
            strength,
          })),
          e => Effect.log('reactively scheduled download', e),
        ),
        executeLatestPlan,
      )

      return {}
    }),
  },
) {}
