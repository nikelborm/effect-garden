import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Stream from 'effect/Stream'

import type { Strength } from '../audioAssetHelpers.ts'
import { AccordRegistry, type AllAccordUnion } from './AccordRegistry.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import { type AllPatternUnion, PatternRegistry } from './PatternRegistry.ts'
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
      const current = Effect.all({
        accord: accordRegistry.currentlyActiveAccord,
        pattern: patternRegistry.currentlyActivePattern,
        strength: strengthRegistry.currentlyActiveStrength,
      })

      const completionStatus = Effect.flatMap(
        current,
        ({ accord, pattern, strength }) =>
          estimationMap.getCompletionStatus({
            _tag: 'pattern',
            accordIndex: accord.index,
            patternIndex: pattern.index,
            strength,
          }),
      )

      return {
        current,
        completionStatus,
        changes: EFunction.pipe(
          Stream.mergeWithTag(
            {
              strength: strengthRegistry.activeStrengthChanges,
              accord: accordRegistry.activeAccordChanges,
              pattern: patternRegistry.activePatternChanges,
            },
            { concurrency: 'unbounded' },
          ),
          Stream.scan(
            {} as {
              readonly strength: Strength
              readonly pattern: AllPatternUnion
              readonly accord: AllAccordUnion
            },
            (
              previousSelectedAsset,
              { _tag: updatedParam, value: newParamValue },
            ) => ({ ...previousSelectedAsset, [updatedParam]: newParamValue }),
          ),
          Stream.filter(state => Object.keys(state).length === 3),
        ),
      }
    }),
  },
) {}
