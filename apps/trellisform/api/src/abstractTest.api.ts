import {
  withOpenApiAnnotationsForStructs as _withOpenApiAnnotations,
  withNewStructTag,
} from '@evadev/effect-helpers'
import {
  AbstractTestIdFromStringSchema,
  AbstractTestSchema,
} from '@trellisform/model'

import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/http-api/HttpApiGroup'
import * as Schema from 'effect/Schema'

import { omitStruct } from './omitStruct.ts'

const withOpenApiAnnotations = _withOpenApiAnnotations('@trellisform/api')

export const CreateAbstractTestManuallyRequestSchema = omitStruct(
  AbstractTestSchema,
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
  {
    payload: CreateAbstractTestManuallyRequestSchema,
    success: Schema.Any,
    error: Schema.Any,
  },
)

// testName: str = "untitled test"
// topic: str = "integral"
// subject: str = "math"
// difficulty: str = "easy" # Уровень сложности: easy, medium, hard
// problems: list[ProblemModel]

export const CreateAbstractTestWithAiEndpoint = HttpApiEndpoint.post(
  'Create test with AI',
  '/ai',
  {
    success: Schema.Any,
    error: Schema.Any,
  },
)

export const GetAbstractTestByIdEndpoint = HttpApiEndpoint.get(
  'Get test',
  '/:abstractTestId',
  {
    params: {
      abstractTestId: AbstractTestIdFromStringSchema,
    },
    success: Schema.Any,
    error: Schema.Any,
  },
)

export const AbstractTestApiGroup = HttpApiGroup.make('Abstract test')
  .add(CreateAbstractTestManuallyEndpoint)
  .add(CreateAbstractTestWithAiEndpoint)
  .add(GetAbstractTestByIdEndpoint)
