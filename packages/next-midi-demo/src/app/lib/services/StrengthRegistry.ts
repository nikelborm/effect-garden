import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import type * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { type Strength, StrengthSchema } from '../audioAssetHelpers.ts'

const allStrengths = ['s', 'm', 'v'] as const

export class StrengthRegistry
  extends Effect.Service<StrengthRegistry>()(
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
  )
  implements IStrengthRegistry {}

interface IStrengthRegistry {
  readonly currentlySelectedStrength: Effect.Effect<Strength>
  readonly allStrengths: Effect.Effect<AllStrengthTuple>
  readonly selectedStrengthChanges: Stream.Stream<Strength>
  readonly selectStrength: (strength: Strength) => Effect.Effect<void>
}

export type AllStrengthTuple = readonly ['s', 'm', 'v']
