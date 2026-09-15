import { API } from '@trellisform/api'

import * as Effect from 'effect/Effect'
import * as HttpServerResponse from 'effect/unstable/http/HttpServerResponse'
import * as HttpApiBuilder from 'effect/unstable/httpapi/HttpApiBuilder'

export const EducationalSpaceHttpGroupLive = HttpApiBuilder.group(
  API,
  'Educational space',
  handlers =>
    handlers
      .handle(
        'Create educational space',
        Effect.fn('Create educational space handler')(function* ({}) {
          yield* Effect.sleep('2 seconds')

          return yield* HttpServerResponse.text('ok')
        }),
      )
      .handle(
        'Get educational spaces the authed user have the rights to launch tests in',
        Effect.fn(
          'Get educational spaces the authed user have the rights to launch tests in handler',
        )(function* ({}) {
          yield* Effect.sleep('2 seconds')

          return yield* HttpServerResponse.text('ok')
        }),
      ),
)
