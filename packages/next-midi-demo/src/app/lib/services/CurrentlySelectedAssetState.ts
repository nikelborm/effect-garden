import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'

import type { Strength } from '../helpers/audioAssetHelpers.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

export class CurrentlySelectedAssetState extends Effect.Service<CurrentlySelectedAssetState>()(
  'next-midi-demo/CurrentlySelectedAssetState',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const strengthRegistry = yield* StrengthRegistry

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
          () => Stream.succeed({ status: 'finished' } as AssetCompletionStatus),
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

export type AssetCompletionStatus =
  | { status: 'not finished'; currentBytes: number }
  | { status: 'almost finished: fetched, but not written' }
  | { status: 'finished' }
