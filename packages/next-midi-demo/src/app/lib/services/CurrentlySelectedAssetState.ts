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

      const selectedAssetChangesStream =
        yield* strengthRegistry.selectedStrengthChanges.pipe(
          Stream.tap(selectedAsset =>
            Effect.log('Selected asset stream value: ', selectedAsset),
          ),
          Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
        )

      const getPatchedAssetFetchingCompletionStatusChangesStream = (
        patch: Patch,
      ) =>
        Stream.flatMap(
          selectedAssetChangesStream,
          EFunction.flow(
            () =>
              TaggedPatternPointer.make({
                strength: patch,
              }),
            estimationMap.getAssetFetchingCompletionStatusChangesStream,
          ),
          { switch: true, concurrency: 1 },
        )

      return {
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
