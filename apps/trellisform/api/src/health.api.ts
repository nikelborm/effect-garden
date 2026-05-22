import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint'
import * as HttpApiGroup from '@effect/platform/HttpApiGroup'
import * as Schema from 'effect/Schema'

export const GetCurrentHealthEndpoint = HttpApiEndpoint.get(
  'Get current health',
  '/',
).addSuccess(Schema.String)

export const HealthApiGroup = HttpApiGroup.make('Health').add(
  GetCurrentHealthEndpoint,
)
