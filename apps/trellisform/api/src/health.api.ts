import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/http-api/HttpApiGroup'
import * as Schema from 'effect/Schema'

export const GetCurrentHealthEndpoint = HttpApiEndpoint.get(
  'Get current health',
  '/',
  {
    success: Schema.String,
  },
)

export const HealthApiGroup = HttpApiGroup.make('Health').add(
  GetCurrentHealthEndpoint,
)
