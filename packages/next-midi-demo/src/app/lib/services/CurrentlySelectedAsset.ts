import * as Effect from 'effect/Effect'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import type {
  PatternPointer,
  RecordedAccordIndexes,
  RecordedPatternIndexes,
  Strength,
} from '../audioAssetHelpers.ts'

export class CurrentlySelectedAsset extends Effect.Service<CurrentlySelectedAsset>()(
  'next-midi-demo/CurrentlySelectedAsset',
  {
    effect: Effect.map(
      SubscriptionRef.make<PatternPointer>({
        accordIndex: 0,
        patternIndex: 0,
        strength: 'm',
      }),
      currentAssetRef => ({
        get: () => SubscriptionRef.get(currentAssetRef),
        changes: () => currentAssetRef.changes,
        setPattern: (patternIndex: RecordedPatternIndexes) =>
          SubscriptionRef.update(currentAssetRef, prev =>
            prev.patternIndex === patternIndex
              ? prev
              : { ...prev, patternIndex },
          ),
        setAccord: (accordIndex: RecordedAccordIndexes) =>
          SubscriptionRef.update(currentAssetRef, prev =>
            prev.accordIndex === accordIndex ? prev : { ...prev, accordIndex },
          ),
        setStrength: (strength: Strength) =>
          SubscriptionRef.update(currentAssetRef, prev =>
            prev.strength === strength ? prev : { ...prev, strength },
          ),
      }),
    ),
  },
) {}
