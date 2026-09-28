import * as Schema from 'effect/Schema'
import * as HttpApiEndpoint from 'effect/unstable/httpapi/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/unstable/httpapi/HttpApiGroup'

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
