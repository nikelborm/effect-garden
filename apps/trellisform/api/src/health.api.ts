import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import { Schema } from 'effect'

export const GetCurrentHealthEndpoint = HttpApiEndpoint.get(
  'Get current health',
  '/',
).addSuccess(Schema.String)

export const HealthApiGroup = HttpApiGroup.make('Health').add(
  GetCurrentHealthEndpoint,
)
