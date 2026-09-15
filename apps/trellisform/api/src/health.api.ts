import * as Schema from 'effect/Schema'
import * as HttpApiEndpoint from 'effect/unstable/httpapi/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/unstable/httpapi/HttpApiGroup'

export const GetCurrentHealthEndpoint = HttpApiEndpoint.get(
  'Get current health',
  '/',
).addSuccess(Schema.String)

export const HealthApiGroup = HttpApiGroup.make('Health').add(
  GetCurrentHealthEndpoint,
)
