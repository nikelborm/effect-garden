import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { type Strength, StrengthSchema } from '../helpers/audioAssetHelpers.ts'

const allStrengths = ['m', 'v', 's'] as const

export class StrengthRegistry extends Effect.Service<StrengthRegistry>()(
  'next-midi-demo/StrengthRegistry',
  {
    accessors: true,
    effect: Effect.map(
      SubscriptionRef.make<Strength>('m'),
      currentStrengthRef => ({
        currentlySelectedStrength: SubscriptionRef.get(currentStrengthRef),
        allStrengths: Effect.succeed(allStrengths),
        selectedStrengthChanges: currentStrengthRef.changes,
        selectStrength: (strength: Strength) => {
          const trustedStrength = Schema.decodeSync(StrengthSchema)(strength)

          return SubscriptionRef.set(currentStrengthRef, trustedStrength)
        },
      }),
    ),
  },
) {}

export type AllStrengthTuple = typeof allStrengths
