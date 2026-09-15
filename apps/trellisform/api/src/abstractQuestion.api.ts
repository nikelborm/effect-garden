import {
  AbstractAnswerOptionIdFromNumberSchema,
  AbstractQuestionIdFromStringSchema,
} from '@trellisform/model'

import * as HttpApiEndpoint from 'effect/unstable/httpapi/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/unstable/httpapi/HttpApiGroup'
import * as HttpApiSchema from 'effect/unstable/httpapi/HttpApiSchema'

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
