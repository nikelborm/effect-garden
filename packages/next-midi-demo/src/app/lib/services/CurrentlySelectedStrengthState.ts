import * as Effect from 'effect/Effect'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import type { Strength } from '../audioAssetHelpers.ts'

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
