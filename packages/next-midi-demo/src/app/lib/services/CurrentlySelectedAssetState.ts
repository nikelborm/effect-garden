import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Stream from 'effect/Stream'

import type { AssetPointer, Strength } from '../audioAssetHelpers.ts'
import { streamAll } from '../helpers/streamAll.ts'
import {
  Accord,
  AccordRegistry,
  type AllAccordUnion,
} from './AccordRegistry.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import {
  type AllPatternUnion,
  Pattern,
  PatternRegistry,
} from './PatternRegistry.ts'
import { StrengthRegistry } from './StrengthRegistry.ts'

export class CurrentlySelectedAssetState extends Effect.Service<CurrentlySelectedAssetState>()(
  'next-midi-demo/CurrentlySelectedAssetState',
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const accordRegistry = yield* AccordRegistry
      const patternRegistry = yield* PatternRegistry
      const strengthRegistry = yield* StrengthRegistry
      const estimationMap = yield* LoadedAssetSizeEstimationMap
      const currentEffect: Effect.Effect<CurrentSelectedAsset> = Effect.all({
        accord: accordRegistry.currentlyActiveAccord,
        pattern: patternRegistry.currentlyActivePattern,
        strength: strengthRegistry.currentlyActiveStrength,
      })
      const selectedAssetChangesStream = streamAll({
        strength: strengthRegistry.activeStrengthChanges,
        accord: accordRegistry.activeAccordChanges,
        pattern: patternRegistry.activePatternChanges,
      })

      const completionStatus = Effect.flatMap(
        currentEffect,
        ({ accord, pattern, strength }) =>
          estimationMap.getAssetFetchingCompletionStatus({
            _tag: 'pattern',
            accordIndex: accord.index,
            patternIndex: pattern.index,
            strength,
          }),
      )
      const makePatchApplier =
        (patch: Patch) =>
        ({ accord, pattern, strength }: CurrentSelectedAsset) =>
          ({
            _tag: 'pattern',
            accordIndex: accord.index,
            // @ts-expect-error ts is wrong. patternIndex might, OR MIGHT NOT be overwritten, so it's not a senseless assignment
            patternIndex: pattern.index,
            strength,
            ...(Pattern.models(patch)
              ? { patternIndex: patch.index }
              : Accord.models(patch)
                ? { accordIndex: patch.index }
                : { strength: patch }),
          }) satisfies AssetPointer

      const getPatchedAssetFetchingCompletionStatus = (patch: Patch) => {
        const applyPatch = makePatchApplier(patch)
        return Effect.flatMap(
          currentEffect,
          EFunction.flow(
            applyPatch,
            estimationMap.getAssetFetchingCompletionStatus,
          ),
        )
      }

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
          { switch: true },
        )
      }

      return {
        current: currentEffect,
        completionStatus,
        getPatchedAssetFetchingCompletionStatus,
        getPatchedAssetFetchingCompletionStatusChangesStream,
        changes: selectedAssetChangesStream,
      }
    }),
  },
) {}

interface CurrentSelectedAsset {
  readonly strength: Strength
  readonly pattern: AllPatternUnion
  readonly accord: AllAccordUnion
}
type Patch = AllPatternUnion | AllAccordUnion | Strength
