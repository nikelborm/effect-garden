import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import { StrengthSchema, type StrengthUnion } from '../audioAssetHelpers.ts'

const allStrengths = ['m', 'v', 's'] as const

export class StrengthRegistry
  extends Effect.Service<StrengthRegistry>()(
    'next-midi-demo/StrengthRegistry',
    {
      accessors: true,
      scoped: Effect.gen(function* () {
        const selectedStrengthRef =
          yield* SubscriptionRef.make<StrengthUnion>('m')
        const selectedStrengthChanges = yield* selectedStrengthRef.changes.pipe(
          Stream.changes,
          Stream.rechunk(1),
          Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
        )
        return {
          currentlySelectedStrength: selectedStrengthRef.get,
          allStrengths: Effect.succeed(allStrengths),
          selectedStrengthChanges,
          selectStrength: (strength: StrengthUnion) => {
            const trustedStrength = Schema.decodeSync(StrengthSchema)(strength)

            return SubscriptionRef.set(selectedStrengthRef, trustedStrength)
          },
        }
      }),
    },
  )
  implements IStrengthRegistry {}

interface IStrengthRegistry {
  readonly currentlySelectedStrength: Effect.Effect<StrengthUnion>
  readonly allStrengths: Effect.Effect<AllStrengthTuple>
  readonly selectedStrengthChanges: Stream.Stream<StrengthUnion>
  readonly selectStrength: (strength: StrengthUnion) => Effect.Effect<void>
}

export type AllStrengthTuple = typeof allStrengths
