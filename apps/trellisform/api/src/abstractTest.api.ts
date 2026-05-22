import {
  withOpenApiAnnotationsForStructs as _withOpenApiAnnotations,
  withNewStructTag,
} from '@evadev/effect-helpers'
import {
  AbstractTestIdFromStringSchema,
  AbstractTestSchema,
} from '@trellisform/model'

import {
  HttpApiClient,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
} from '@effect/platform'
import { Schema } from 'effect'

const withOpenApiAnnotations = _withOpenApiAnnotations('@trellisform/api')

export const AbstractTestIdParam = HttpApiSchema.param(
  'abstractTestId',
  AbstractTestIdFromStringSchema,
)

export const CreateAbstractTestManuallyRequestSchema = AbstractTestSchema.omit(
  'id',
).pipe(
  withNewStructTag('CreateAbstractTestManuallyRequest'),
  withOpenApiAnnotations({
    title: 'Запрос на создание абстрактного теста',
    description: '',
  }),
)

export const CreateAbstractTestManuallyEndpoint = HttpApiEndpoint.post(
  'Create abstract test manually',
  '/manual',
)
  .setPayload(CreateAbstractTestManuallyRequestSchema)
  .addSuccess(Schema.Any)
  .addError(Schema.Any)

// testName: str = "untitled test"
// topic: str = "integral"
// subject: str = "math"
// difficulty: str = "easy" # Уровень сложности: easy, medium, hard
// problems: list[ProblemModel]

export const CreateAbstractTestWithAiEndpoint = HttpApiEndpoint.post(
  'Create test with AI',
  '/ai',
)
  .addSuccess(Schema.Any)
  .addError(Schema.Any)

export const GetAbstractTestByIdEndpoint = HttpApiEndpoint.get(
  'Get test',
)`/${AbstractTestIdParam}`
  .addSuccess(Schema.Any)
  .addError(Schema.Any)

export const AbstractTestApiGroup = HttpApiGroup.make('Abstract test')
  .add(CreateAbstractTestManuallyEndpoint)
  .add(CreateAbstractTestWithAiEndpoint)
  .add(GetAbstractTestByIdEndpoint)
