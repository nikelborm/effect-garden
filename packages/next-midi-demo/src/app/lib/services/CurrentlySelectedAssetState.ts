import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import type {
  PatternPointer,
  RecordedAccordIndexes,
  RecordedPatternIndexes,
  Strength,
} from '../audioAssetHelpers.ts'

export class CurrentlySelectedAccordIndexState extends Effect.Service<CurrentlySelectedAccordIndexState>()(
  'next-midi-demo/CurrentlySelectedAssetState/CurrentlySelectedAccordIndexState',
  {
    accessors: true,
    effect: Effect.map(
      SubscriptionRef.make<RecordedAccordIndexes>(0),
      currentAccordIndexRef => ({
        current: SubscriptionRef.get(currentAccordIndexRef),
        changes: currentAccordIndexRef.changes,
        set: (accordIndex: RecordedAccordIndexes) =>
          SubscriptionRef.set(currentAccordIndexRef, accordIndex),
      }),
    ),
  },
) {}

export class CurrentlySelectedPatternIndexState extends Effect.Service<CurrentlySelectedPatternIndexState>()(
  'next-midi-demo/CurrentlySelectedAssetState/CurrentlySelectedPatternIndexState',
  {
    accessors: true,
    effect: Effect.map(
      SubscriptionRef.make<RecordedPatternIndexes>(0),
      currentPatternIndexRef => ({
        current: SubscriptionRef.get(currentPatternIndexRef),
        changes: currentPatternIndexRef.changes,
        set: (patternIndex: RecordedPatternIndexes) =>
          SubscriptionRef.set(currentPatternIndexRef, patternIndex),
      }),
    ),
  },
) {}

export class CurrentlySelectedStrengthState extends Effect.Service<CurrentlySelectedStrengthState>()(
  'next-midi-demo/CurrentlySelectedAssetState/CurrentlySelectedStrengthState',
  {
    accessors: true,
    effect: Effect.map(
      SubscriptionRef.make<Strength>('m'),
      currentStrengthRef => ({
        current: SubscriptionRef.get(currentStrengthRef),
        changes: currentStrengthRef.changes,
        set: (strength: Strength) =>
          SubscriptionRef.set(currentStrengthRef, strength),
      }),
    ),
  },
) {}

export class CurrentlySelectedAssetState extends Effect.Service<CurrentlySelectedAssetState>()(
  'next-midi-demo/CurrentlySelectedAssetState',
  {
    accessors: true,
    dependencies: [
      CurrentlySelectedAccordIndexState.Default,
      CurrentlySelectedPatternIndexState.Default,
      CurrentlySelectedStrengthState.Default,
    ],
    effect: Effect.map(
      Effect.all({
        accordIndexState: CurrentlySelectedAccordIndexState,
        patternIndexState: CurrentlySelectedPatternIndexState,
        strengthState: CurrentlySelectedStrengthState,
      }),
      ({ accordIndexState, patternIndexState, strengthState }) => ({
        current: Effect.all({
          accordIndex: accordIndexState.current,
          patternIndex: patternIndexState.current,
          strength: strengthState.current,
        }),
        changes: EFunction.pipe(
          Stream.mergeWithTag(
            {
              strength: strengthState.changes,
              accordIndex: accordIndexState.changes,
              patternIndex: patternIndexState.changes,
            },
            { concurrency: 'unbounded' },
          ),
          Stream.scan(
            {} as PatternPointer,
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
