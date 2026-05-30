import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  Accord,
  type AllAccordTuple,
  allAccords,
} from '../brandsAndDatas/Accord.ts'

// TODO: make currentAccordRef and related shit branded
export class AccordRegistry
  extends Effect.Service<AccordRegistry>()('next-midi-demo/AccordRegistry', {
    accessors: true,
    scoped: Effect.gen(function* () {
      const currentAccordRef = yield* SubscriptionRef.make(Accord(0))

      const selectedAccordChanges = yield* currentAccordRef.changes.pipe(
        Stream.changes,
        Stream.rechunk(1),
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      return {
        currentlySelectedAccord: currentAccordRef.get,
        allAccords: Effect.succeed(allAccords),
        selectedAccordChanges,
        selectAccord: (accord: Accord) =>
          SubscriptionRef.set(currentAccordRef, accord),
      }
    }),
  })
  implements IAccordRegistry {}

interface IAccordRegistry {
  readonly currentlySelectedAccord: Effect.Effect<Accord>
  readonly allAccords: Effect.Effect<AllAccordTuple>
  readonly selectedAccordChanges: Stream.Stream<Accord>
  readonly selectAccord: (accord: Accord) => Effect.Effect<void>
}
