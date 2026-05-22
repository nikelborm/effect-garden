import { API } from '@trellisform/api'
import { UserWithSession } from '@trellisform/api/auth.ts'
import { abstractTest } from '@trellisform/database/schema'

import { HttpApiBuilder, HttpServerResponse } from '@effect/platform'
import { Console, Effect, Struct } from 'effect'

import { Database } from '../infrastructure/Database.ts'

export const AbstractTestHttpGroupLive = HttpApiBuilder.group(
  API,
  'Abstract test',
  Effect.fn(function* (handlers) {
    const db = yield* Database
    return handlers

      .handle(
        'Create abstract test manually',
        Effect.fn('Create abstract test manually handler')(function* ({
          payload,
        }) {
          const {
            user: { id: userId },
          } = yield* UserWithSession

          yield* db.insert(abstractTest).values({
            ...Struct.omit(payload, '_tag'),
            createdByUserId: userId,
          })

          return yield* HttpServerResponse.text('ok')
        }),
      )
      .handle(
        'Create test with AI',
        Effect.fn('Create abstract test with AI handler')(function* ({}) {
          yield* Effect.sleep('2 seconds')

          return yield* HttpServerResponse.text('ok')
        }),
      )
      .handle(
        'Get test',
        Effect.fn('Get abstract test handler')(function* ({
          path: { abstractTestId },
        }) {
          const asd = yield* UserWithSession
          yield* Console.log(asd)

          yield* Effect.annotateCurrentSpan('abstract test id', abstractTestId)
          yield* Effect.sleep('2 seconds')

          return yield* HttpServerResponse.text('ok')
        }),
      )
  }),
)
