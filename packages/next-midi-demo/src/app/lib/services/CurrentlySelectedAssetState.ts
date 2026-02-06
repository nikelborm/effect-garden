import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Stream from 'effect/Stream'

import type { Strength } from '../audioAssetHelpers.ts'
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

      const completionStatusOfPatched = (
        patched: AllPatternUnion | AllAccordUnion | Strength,
      ) =>
        Effect.flatMap(current, ({ accord, pattern, strength }) =>
          estimationMap.getCompletionStatus({
            _tag: 'pattern',
            accordIndex: accord.index,
            // @ts-expect-error ts is wrong. patternIndex might, OR MIGHT NOT be overwritten, so it's not a senseless assignment
            patternIndex: pattern.index,
            strength,
            ...(Pattern.models(patched)
              ? { patternIndex: patched.index }
              : Accord.models(patched)
                ? { accordIndex: patched.index }
                : { strength: patched }),
          }),
        )

      return {
        current,
        completionStatus,
        completionStatusOfPatched,
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
