import * as Effect from 'effect/Effect'

import type { IdType } from './buildEntityParts.ts'

export const ensureReturningOneId =
  <const T extends string>(table: T) =>
  <A extends { id: number }[], E, R>(self: Effect.Effect<A, E, R>) =>
    Effect.flatMap(self, e =>
      e.length === 1
        ? Effect.succeed(e[0]?.id as IdType<T>)
        : Effect.die(
            'Tried to insert 1 value, but got returned an amount of rows different from 1',
          ),
    )
