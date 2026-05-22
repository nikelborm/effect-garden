import {
  AbstractAnswerOptionIdFromNumberSchema,
  AbstractAnswerOptionSchema,
  AbstractQuestionIdFromStringSchema,
  AbstractQuestionSchema,
} from '@trellisform/model'

import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint'
import * as HttpApiGroup from '@effect/platform/HttpApiGroup'
import * as HttpApiSchema from '@effect/platform/HttpApiSchema'
import * as Schema from 'effect/Schema'

export const AbstractQuestionIdParam = HttpApiSchema.param(
  'abstractQuestionId',
  AbstractQuestionIdFromStringSchema,
)

export const DeleteAbstractQuestionEndpoint = HttpApiEndpoint.del(
  'Delete abstract question',
)`/${AbstractQuestionIdParam}`

export const CreateAbstractAnswerOptionEndpoint = HttpApiEndpoint.post(
  'Create abstract answer option',
)`/${AbstractQuestionIdParam}/answerOption`.addSuccess(
  AbstractAnswerOptionIdFromNumberSchema,
)

export const AbstractQuestionApiGroup = HttpApiGroup.make('Abstract question')
  .add(CreateAbstractAnswerOptionEndpoint)
  .add(DeleteAbstractQuestionEndpoint)
