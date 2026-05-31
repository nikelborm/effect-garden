import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  type AllStrengthTuple,
  allStrengths,
  defaultStrength,
  type Strength,
} from '../brandsAndDatas/Strength.ts'

export class StrengthRegistry
  extends Effect.Service<StrengthRegistry>()(
    'next-midi-demo/StrengthRegistry',
    {
      accessors: true,
      scoped: Effect.gen(function* () {
        const selectedStrengthRef = yield* SubscriptionRef.make(defaultStrength)

        const selectedStrengthChanges = yield* selectedStrengthRef.changes.pipe(
          Stream.changes,
          Stream.rechunk(1),
          Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
        )

        return {
          currentlySelectedStrength: selectedStrengthRef.get,
          allStrengths: Effect.succeed(allStrengths),
          selectedStrengthChanges,
          selectStrength: (strength: Strength) =>
            SubscriptionRef.set(selectedStrengthRef, strength),
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
