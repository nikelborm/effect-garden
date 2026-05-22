import { withOpenApiAnnotationsForStructs as _withOpenApiAnnotations } from '@evadev/effect-helpers'
import {
  AbstractAnswerOptionIdFromNumberSchema,
  AbstractQuestionIdFromNumberSchema,
  AbstractTestStageIdFromStringSchema,
} from '@trellisform/model'

import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint'
import * as HttpApiGroup from '@effect/platform/HttpApiGroup'
import * as HttpApiSchema from '@effect/platform/HttpApiSchema'
import * as Schema from 'effect/Schema'

const withOpenApiAnnotations = _withOpenApiAnnotations('@trellisform/api')

export const AbstractTestStageIdParam = HttpApiSchema.param(
  'abstractTestStageId',
  AbstractTestStageIdFromStringSchema,
)

export const GetAbstractTestStageByIdEndpoint = HttpApiEndpoint.get(
  'Get test stage',
)`/${AbstractTestStageIdParam}`
  .addSuccess(Schema.Any)
  .addError(Schema.Any)

export const CreateAbstractQuestionResponseSchema = Schema.TaggedStruct(
  'CreateAbstractQuestionResponse',
  {
    abstractQuestionId: AbstractQuestionIdFromNumberSchema,
    abstractAnswerOptionId1: AbstractAnswerOptionIdFromNumberSchema,
    abstractAnswerOptionId2: AbstractAnswerOptionIdFromNumberSchema,
  },
).pipe(
  withOpenApiAnnotations({
    title: 'Ответ на запрос добавления вопроса в вариант теста',
    description:
      'Создаёт новый вопрос, автоматически добавляет два варианта ответа в него, и возвращает айдишники новых сущностей',
  }),
)

export const CreateAbstractQuestionEndpoint = HttpApiEndpoint.post(
  'Create abstract question',
)`/${AbstractTestStageIdParam}/question`.addSuccess(
  CreateAbstractQuestionResponseSchema,
)

export const AbstractTestStageApiGroup = HttpApiGroup.make(
  'Abstract test stage',
)
  .add(CreateAbstractQuestionEndpoint)
  .add(GetAbstractTestStageByIdEndpoint)
