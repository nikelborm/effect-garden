import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as Order from 'effect/Order'
import * as Schema from 'effect/Schema'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { type Strength, StrengthSchema } from '../audioAssetHelpers.ts'

const allStrengths = ['m', 'v', 's'] as const

export class StrengthData extends Data.TaggedClass('Strength')<{
  value: Strength
}> {
  constructor(strength: string) {
    if (strength !== 's' && strength !== 'm' && strength !== 'v')
      throw new Error(
        `StrengthData expected strength, but got: ${JSON.stringify(strength)}`,
      )
    super({ value: strength })
  }
}
export const StrengthDataOrder = Order.mapInput(
  Order.string,
  (_: StrengthData) => _.value,
)

export class StrengthRegistry
  extends Effect.Service<StrengthRegistry>()(
    'next-midi-demo/StrengthRegistry',
    {
      accessors: true,
      scoped: Effect.gen(function* () {
        const selectedStrengthRef = yield* SubscriptionRef.make<Strength>('m')
        const selectedStrengthChanges = yield* selectedStrengthRef.changes.pipe(
          Stream.changes,
          Stream.rechunk(1),
          Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
        )
        return {
          currentlySelectedStrength: selectedStrengthRef.get,
          allStrengths: Effect.succeed(allStrengths),
          selectedStrengthChanges,
          selectStrength: (strength: Strength) => {
            const trustedStrength = Schema.decodeSync(StrengthSchema)(strength)

            return SubscriptionRef.set(selectedStrengthRef, trustedStrength)
          },
        }
      }),
    },
  )
  implements IStrengthRegistry {}

interface IStrengthRegistry {
  readonly currentlySelectedStrength: Effect.Effect<Strength>
  readonly allStrengths: Effect.Effect<AllStrengthTuple>
  readonly selectedStrengthChanges: Stream.Stream<Strength>
  readonly selectStrength: (strength: Strength) => Effect.Effect<void>
}

export type AllStrengthTuple = typeof allStrengths
