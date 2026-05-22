import { API } from '@trellisform/api'

import { HttpApiBuilder, HttpServerResponse } from '@effect/platform'
import { Effect } from 'effect'

import { Database } from '../infrastructure/Database.ts'

export const TestVariantAttemptHttpGroupLive = HttpApiBuilder.group(
  API,
  'Test variant attempt',
  Effect.fn(function* (handlers) {
    const db = yield* Database

    return handlers.handle(
      'Get my test variant attempts',
      Effect.fn('Get my test variant attempts')(function* ({}) {
        yield* Effect.sleep('2 seconds')

        const asd = yield* db.query.abstractAnswerOption.findFirst()
        return yield* HttpServerResponse.text('ok')
      }),
    )
  }),
)
