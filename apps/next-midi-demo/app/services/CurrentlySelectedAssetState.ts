import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Stream from 'effect/Stream'

import { complexifyAssetPointer } from '../brandsAndDatas/AssetPointer.ts'
import { makePatchApplier, type Patch } from '../helpers/makePatchApplier.ts'
import { streamAll } from '../helpers/streamAll.ts'
import { AccordRegistry } from './AccordRegistry.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import { PatternRegistry } from './PatternRegistry.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

export class CurrentlySelectedAssetState extends Effect.Service<CurrentlySelectedAssetState>()(
  'next-midi-demo/CurrentlySelectedAssetState',
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      const accordRegistry = yield* AccordRegistry
      const patternRegistry = yield* PatternRegistry
      const strengthRegistry = yield* StrengthRegistry
      const estimationMap = yield* LoadedAssetSizeEstimationMap

      const currentEffect = Effect.all({
        accord: accordRegistry.currentlySelectedAccord,
        pattern: patternRegistry.currentlySelectedPattern,
        strength: strengthRegistry.currentlySelectedStrength,
      }).pipe(Effect.map(complexifyAssetPointer))

      const selectedAssetChangesStream = yield* streamAll({
        strength: strengthRegistry.selectedStrengthChanges,
        accord: accordRegistry.selectedAccordChanges,
        pattern: patternRegistry.selectedPatternChanges,
      }).pipe(
        Stream.map(complexifyAssetPointer),
        Stream.tap(selectedAsset =>
          Effect.log('Selected asset stream value: ', selectedAsset),
        ),
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      const completionStatus = Effect.flatMap(
        currentEffect,
        estimationMap.getAssetFetchingCompletionStatus,
      )

      const completionStatusChangesStream =
        yield* selectedAssetChangesStream.pipe(
          Stream.flatMap(
            estimationMap.getAssetFetchingCompletionStatusChangesStream,
            { switch: true, concurrency: 1 },
          ),
          Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
        )

      const isFinishedDownloadCompletely = Effect.map(
        completionStatus,
        ({ status }) => status === 'finished',
      )

      const isFinishedDownloadCompletelyFlagChangesStream =
        yield* completionStatusChangesStream.pipe(
          Stream.map(({ status }) => status === 'finished'),
          Stream.changes,
          Stream.rechunk(1),
          Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
        )

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
        isFinishedDownloadCompletely,
        isFinishedDownloadCompletelyFlagChangesStream,
        getPatchedAssetFetchingCompletionStatusChangesStream,
        changes: selectedAssetChangesStream,
      }
    }).pipe(Effect.withSpan('CurrentlySelectedAssetState.init')),
  },
) {}
