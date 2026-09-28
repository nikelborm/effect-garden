import * as Effect from 'effect/Effect'
import type * as FiberMap from 'effect/FiberMap'
import * as MutableHashMap from 'effect/MutableHashMap'

export const getFiberMapKeys = <K, A, E>(self: FiberMap.FiberMap<K, A, E>) =>
  Effect.sync(() =>
    self.state._tag === 'Closed'
      ? []
      : Array.from(MutableHashMap.keys(self.state.backing)),
  )
