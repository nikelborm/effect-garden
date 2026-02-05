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
          currentlyActiveStrength: SubscriptionRef.get(currentStrengthRef),
          allStrengths: Effect.succeed(allStrengths),
          activeStrengthChanges: currentStrengthRef.changes,
          setActiveStrength: (strength: Strength) => {
            const trustedStrength = Schema.decodeSync(StrengthSchema)(strength)

            return SubscriptionRef.set(currentStrengthRef, trustedStrength)
          },
        }),
      ),
    },
  )
  implements IStrengthRegistry {}

interface IStrengthRegistry {
  readonly currentlyActiveStrength: Effect.Effect<Strength>
  readonly allStrengths: Effect.Effect<AllStrengthTuple>
  readonly activeStrengthChanges: Stream.Stream<Strength>
  readonly setActiveStrength: (strength: Strength) => Effect.Effect<void>
}

export type AllStrengthTuple = readonly ['s', 'm', 'v']
