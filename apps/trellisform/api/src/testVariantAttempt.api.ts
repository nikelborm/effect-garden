import { TestVariantAttemptIdFromStringSchema } from '@trellisform/model'

import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint'
import * as HttpApiGroup from '@effect/platform/HttpApiGroup'
import * as HttpApiSchema from '@effect/platform/HttpApiSchema'
import * as Schema from 'effect/Schema'

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
