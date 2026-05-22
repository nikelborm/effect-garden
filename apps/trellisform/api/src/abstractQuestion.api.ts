import {
  AbstractAnswerOptionIdFromNumberSchema,
  AbstractAnswerOptionSchema,
  AbstractQuestionIdFromStringSchema,
  AbstractQuestionSchema,
} from '@trellisform/model'

import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from '@effect/platform'
import { Schema } from 'effect'

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
