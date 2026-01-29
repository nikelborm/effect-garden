import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { type Strength, StrengthSchema } from '../audioAssetHelpers.ts'

export class CurrentlySelectedStrengthState extends Effect.Service<CurrentlySelectedStrengthState>()(
  'next-midi-demo/CurrentlySelectedAssetState/CurrentlySelectedStrengthState',
  {
    accessors: true,
    effect: Effect.map(
      SubscriptionRef.make<Strength>('m'),
      currentStrengthRef => ({
        current: SubscriptionRef.get(currentStrengthRef),
        changes: currentStrengthRef.changes,
        set: (strength: Strength) => {
          const trustedStrength = Schema.decodeSync(StrengthSchema)(strength)
          return SubscriptionRef.set(currentStrengthRef, trustedStrength)
        },
      }),
    ),
  },
) {}
