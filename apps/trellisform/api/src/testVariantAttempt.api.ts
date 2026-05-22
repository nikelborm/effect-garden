import { withOpenApiAnnotationsForStructs as _withOpenApiAnnotations } from '@evadev/effect-helpers'
import { TestVariantAttemptIdFromStringSchema } from '@trellisform/model'

import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from '@effect/platform'
import { Schema } from 'effect'

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
