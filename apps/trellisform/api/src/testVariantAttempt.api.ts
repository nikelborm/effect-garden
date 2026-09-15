import { TestVariantAttemptIdFromStringSchema } from '@trellisform/model'

import * as Schema from 'effect/Schema'
import * as HttpApiEndpoint from 'effect/unstable/httpapi/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/unstable/httpapi/HttpApiGroup'
import * as HttpApiSchema from 'effect/unstable/httpapi/HttpApiSchema'

// const withOpenApiAnnotations = _withOpenApiAnnotations('@trellisform/api');

export const TestVariantAttemptIdParam = HttpApiSchema.param(
  'testVariantAttemptId',
  TestVariantAttemptIdFromStringSchema,
)

export const GetMyTestVariantAttempts = HttpApiEndpoint.get(
  'Get my test variant attempts',
  '/mine',
)
  .addSuccess(Schema.Any)
  .addError(Schema.Any)

export const TestVariantAttemptApiGroup = HttpApiGroup.make(
  'Test variant attempt',
).add(GetMyTestVariantAttempts)
