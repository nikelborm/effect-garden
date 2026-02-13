import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Stream from 'effect/Stream'

import { type Strength, TaggedPatternPointer } from '../audioAssetHelpers.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

export class CurrentlySelectedAssetState extends Effect.Service<CurrentlySelectedAssetState>()(
  'next-midi-demo/CurrentlySelectedAssetState',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const strengthRegistry = yield* StrengthRegistry
      const estimationMap = yield* LoadedAssetSizeEstimationMap
      const currentEffect: Effect.Effect<CurrentSelectedAsset> = Effect.all({
        strength: strengthRegistry.currentlySelectedStrength,
      })

      const selectedAssetChangesStream =
        yield* strengthRegistry.selectedStrengthChanges.pipe(
          Stream.tap(selectedAsset =>
            Effect.log('Selected asset stream value: ', selectedAsset),
          ),
          Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
        )

      const makePatchApplier = (patch: Patch) => () =>
        TaggedPatternPointer.make({
          strength: patch,
        })

      const getPatchedAssetFetchingCompletionStatusChangesStream = (
        patch: Patch,
      ) => {
        const applyPatch = makePatchApplier(patch)
        return Stream.flatMap(
          selectedAssetChangesStream,
          EFunction.flow(
            applyPatch,
            estimationMap.getAssetFetchingCompletionStatusChangesStream,
          ),
          { switch: true, concurrency: 1 },
        )
      }

      return {
        current: currentEffect,
        getPatchedAssetFetchingCompletionStatusChangesStream,
        changes: selectedAssetChangesStream,
      }
    }),
  },
) {}

export interface CurrentSelectedAsset {
  readonly strength: Strength
}

export type Patch = Strength
