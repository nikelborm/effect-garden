import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Stream from 'effect/Stream'

import { AccordRegistry, type AllAccordUnion } from './AccordRegistry.ts'
import { CurrentlySelectedStrengthState } from './CurrentlySelectedStrengthState.ts'
import { type AllPatternUnion, PatternRegistry } from './PatternRegistry.ts'

export class CurrentlySelectedAssetState extends Effect.Service<CurrentlySelectedAssetState>()(
  'next-midi-demo/CurrentlySelectedAssetState',
  {
    accessors: true,
    dependencies: [
      AccordRegistry.Default,
      PatternRegistry.Default,
      CurrentlySelectedStrengthState.Default,
    ],
    effect: Effect.map(
      Effect.all({
        accordRegistry: AccordRegistry,
        patternRegistry: PatternRegistry,
        strengthState: CurrentlySelectedStrengthState,
      }),
      ({ accordRegistry, patternRegistry, strengthState }) => ({
        current: Effect.all({
          accord: accordRegistry.currentlyActiveAccord,
          pattern: patternRegistry.currentlyActivePattern,
          strength: strengthState.current,
        }),
        changes: EFunction.pipe(
          Stream.mergeWithTag(
            {
              strength: strengthState.changes,
              accord: accordRegistry.activeAccordChanges,
              pattern: patternRegistry.activePatternChanges,
            },
            { concurrency: 'unbounded' },
          ),
          Stream.scan(
            {} as {
              readonly strength: 's' | 'm' | 'v'
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
      }),
    ),
  },
) {}
