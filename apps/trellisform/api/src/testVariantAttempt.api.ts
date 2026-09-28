import * as HttpApiEndpoint from 'effect/httpapi/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/httpapi/HttpApiGroup'
import * as Schema from 'effect/Schema'

// const withOpenApiAnnotations = _withOpenApiAnnotations('@trellisform/api');

export const GetMyTestVariantAttempts = HttpApiEndpoint.get(
  'Get my test variant attempts',
  '/mine',
  {
    success: Schema.Any,
    error: Schema.Any,
  },
)

export const TestVariantAttemptApiGroup = HttpApiGroup.make(
  'Test variant attempt',
).add(GetMyTestVariantAttempts)
