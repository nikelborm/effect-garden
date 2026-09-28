import {
  withOpenApiAnnotationsForStructs as _withOpenApiAnnotations,
  withNewStructTag,
} from '@evadev/effect-helpers'
import {
  AbstractTestStageSchema,
  AbstractTestVariantIdFromStringSchema,
  TestVariantAttemptSchema,
} from '@trellisform/model'

import * as Schema from 'effect/Schema'
import * as HttpApiEndpoint from 'effect/unstable/httpapi/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/unstable/httpapi/HttpApiGroup'

import { omitStruct } from './omitStruct.ts'

const withOpenApiAnnotations = _withOpenApiAnnotations('@trellisform/api')

export const CreateAbstractTestVariantManuallyEndpoint = HttpApiEndpoint.post(
  'Create test variant manually',
  '/manual',
  {
    payload: Schema.Any,
    success: Schema.Any,
    error: Schema.Any,
  },
)

export const CreateAbstractTestVariantWithAiEndpoint = HttpApiEndpoint.post(
  'Create test variant with AI',
  '/ai',
  {
    success: Schema.Any,
    error: Schema.Any,
  },
)

export const GetAbstractTestVariantByIdEndpoint = HttpApiEndpoint.get(
  'Get test variant',
  '/:abstractTestVariantId',
  {
    params: {
      abstractTestVariantId: AbstractTestVariantIdFromStringSchema,
    },
    success: Schema.Any,
    error: Schema.Any,
  },
)

export const CreateTestVariantAttemptRequestSchema = omitStruct(
  TestVariantAttemptSchema,
  'id',
).pipe(
  withNewStructTag('CreateTestVariantAttemptRequest'),
  withOpenApiAnnotations({
    title: 'Запрос на создание попытки прохождения варианта теста',
    description: '',
  }),
)

export const CreateTestVariantAttemptResponseSchema = TestVariantAttemptSchema

export const CreateTestVariantAttemptEndpoint = HttpApiEndpoint.post(
  'Create test variant attempt',
  '/:abstractTestVariantId/attempt',
  {
    params: {
      abstractTestVariantId: AbstractTestVariantIdFromStringSchema,
    },
    payload: CreateTestVariantAttemptRequestSchema,
    success: CreateTestVariantAttemptResponseSchema,
  },
)

export const CreateTestStageRequestSchema = omitStruct(
  AbstractTestStageSchema,
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
  '/:abstractTestVariantId/',
  {
    params: {
      abstractTestVariantId: AbstractTestVariantIdFromStringSchema,
    },
    payload: CreateTestStageRequestSchema,
    success: CreateTestStageResponseSchema,
  },
)

export const AbstractTestVariantApiGroup = HttpApiGroup.make(
  'Abstract test variant',
)
  .add(CreateAbstractTestVariantManuallyEndpoint)
  .add(CreateAbstractTestVariantWithAiEndpoint)
  .add(CreateTestVariantAttemptEndpoint)
  .add(CreateTestStageEndpoint)
  .add(GetAbstractTestVariantByIdEndpoint)
