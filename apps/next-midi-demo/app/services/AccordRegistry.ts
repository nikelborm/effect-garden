import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  type Accord,
  type AllAccordTuple,
  allAccords,
  defaultAccord,
} from '../brandsAndDatas/Accord.ts'

export class AccordRegistry
  extends Effect.Service<AccordRegistry>()('next-midi-demo/AccordRegistry', {
    accessors: true,
    scoped: Effect.gen(function* () {
      const currentAccordRef = yield* SubscriptionRef.make(defaultAccord)

      const selectedAccordChanges = yield* currentAccordRef.changes.pipe(
        Stream.changes,
        Stream.rechunk(1),
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      return {
        currentlySelectedAccord: currentAccordRef,
        allAccords: Effect.succeed(allAccords),
        selectedAccordChanges,
        selectAccord: (accord: Accord) =>
          SubscriptionRef.set(currentAccordRef, accord),
      }
    }).pipe(Effect.withSpan('AccordRegistry.init')),
  })
  implements IAccordRegistry {}

interface IAccordRegistry {
  readonly currentlySelectedAccord: Effect.Effect<Accord>
  readonly allAccords: Effect.Effect<AllAccordTuple>
  readonly selectedAccordChanges: Stream.Stream<Accord>
  readonly selectAccord: (accord: Accord) => Effect.Effect<void>
}
