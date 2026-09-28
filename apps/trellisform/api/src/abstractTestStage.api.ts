import { withOpenApiAnnotationsForStructs as _withOpenApiAnnotations } from '@evadev/effect-helpers'
import {
  AbstractAnswerOptionIdFromNumberSchema,
  AbstractQuestionIdFromNumberSchema,
  AbstractTestStageIdFromStringSchema,
} from '@trellisform/model'

import * as Schema from 'effect/Schema'
import * as HttpApiEndpoint from 'effect/unstable/httpapi/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/unstable/httpapi/HttpApiGroup'

const withOpenApiAnnotations = _withOpenApiAnnotations('@trellisform/api')

export const GetAbstractTestStageByIdEndpoint = HttpApiEndpoint.get(
  'Get test stage',
  '/:abstractTestStageId',
  {
    params: {
      abstractTestStageId: AbstractTestStageIdFromStringSchema,
    },
    success: Schema.Any,
    error: Schema.Any,
  },
)

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
  '/:abstractTestStageId/question',
  {
    params: {
      abstractTestStageId: AbstractTestStageIdFromStringSchema,
    },
    success: CreateAbstractQuestionResponseSchema,
  },
)

export const AbstractTestStageApiGroup = HttpApiGroup.make(
  'Abstract test stage',
)
  .add(CreateAbstractQuestionEndpoint)
  .add(GetAbstractTestStageByIdEndpoint)
