import {
  withOpenApiAnnotationsForStructs as _withOpenApiAnnotations,
  withNewStructTag,
} from '@evadev/effect-helpers'
import {
  AbstractTestStageSchema,
  AbstractTestVariantIdFromStringSchema,
  TestVariantAttemptSchema,
} from '@trellisform/model'

import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint'
import * as HttpApiGroup from '@effect/platform/HttpApiGroup'
import * as HttpApiSchema from '@effect/platform/HttpApiSchema'
import * as Schema from 'effect/Schema'

const withOpenApiAnnotations = _withOpenApiAnnotations('@trellisform/api')

export const AbstractTestVariantIdParam = HttpApiSchema.param(
  'abstractTestVariantId',
  AbstractTestVariantIdFromStringSchema,
)

export const CreateAbstractTestVariantManuallyEndpoint = HttpApiEndpoint.post(
  'Create test variant manually',
  '/manual',
)
  .setPayload(Schema.Any)
  .addSuccess(Schema.Any)
  .addError(Schema.Any)

export const CreateAbstractTestVariantWithAiEndpoint = HttpApiEndpoint.post(
  'Create test variant with AI',
  '/ai',
)
  .addSuccess(Schema.Any)
  .addError(Schema.Any)

export const GetAbstractTestVariantByIdEndpoint = HttpApiEndpoint.get(
  'Get test variant',
)`/${AbstractTestVariantIdParam}`
  .addSuccess(Schema.Any)
  .addError(Schema.Any)

export const CreateTestVariantAttemptRequestSchema =
  TestVariantAttemptSchema.omit('id').pipe(
    withNewStructTag('CreateTestVariantAttemptRequest'),
    withOpenApiAnnotations({
      title: 'Запрос на создание попытки прохождения варианта теста',
      description: '',
    }),
  )

export const CreateTestVariantAttemptResponseSchema = TestVariantAttemptSchema

export const CreateTestVariantAttemptEndpoint = HttpApiEndpoint.post(
  'Create test variant attempt',
)`/${AbstractTestVariantIdParam}/attempt`
  .setPayload(CreateTestVariantAttemptRequestSchema)
  .addSuccess(CreateTestVariantAttemptResponseSchema)

export const CreateTestStageRequestSchema = AbstractTestStageSchema.omit(
  'id',
).pipe(
  withNewStructTag('CreateTestStageRequest'),
  withOpenApiAnnotations({
    title: 'Запрос на создание этапа варианта теста',
    description: '',
  }),
)

export const CreateTestStageResponseSchema = AbstractTestStageSchema.pipe(
  withNewStructTag('CreateTestStageResponse'),
)

export const CreateTestStageEndpoint = HttpApiEndpoint.post(
  'Create test stage',
)`/${AbstractTestVariantIdParam}/`
  .setPayload(CreateTestStageRequestSchema)
  .addSuccess(CreateTestStageResponseSchema)

export const AbstractTestVariantApiGroup = HttpApiGroup.make(
  'Abstract test variant',
)
  .add(CreateAbstractTestVariantManuallyEndpoint)
  .add(CreateAbstractTestVariantWithAiEndpoint)
  .add(CreateTestVariantAttemptEndpoint)
  .add(CreateTestStageEndpoint)
  .add(GetAbstractTestVariantByIdEndpoint)
