import * as Effect from 'effect/Effect'
import type * as Fiber from 'effect/Fiber'
import type * as FiberMap from 'effect/FiberMap'
import * as MutableHashMap from 'effect/MutableHashMap'

export const getFibersOfFiberMap = <K, A, E>(
  self: FiberMap.FiberMap<K, A, E>,
) => {
  const state = (
    self as unknown as {
      state:
        | { readonly _tag: 'Closed' }
        | {
            readonly _tag: 'Open'
            readonly backing: MutableHashMap.MutableHashMap<
              K,
              Fiber.RuntimeFiber<A, E>
            >
          }
    }
  ).state

  return Effect.sync(() =>
    state._tag === 'Closed' ? [] : MutableHashMap.values(state.backing),
  )
}
