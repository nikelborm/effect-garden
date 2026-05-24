import { API } from '@trellisform/api'

import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder'
import * as HttpServerResponse from '@effect/platform/HttpServerResponse'
import * as Effect from 'effect/Effect'

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

        const _asd = yield* db.query.abstractAnswerOption.findFirst()
        return yield* HttpServerResponse.text('ok')
      }),
    )
  }),
)
