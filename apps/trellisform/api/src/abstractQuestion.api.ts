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

export const DeleteAbstractQuestionEndpoint = HttpApiEndpoint.delete(
  'Delete abstract question',
  `/:abstractQuestionId`,{
    params:{
      abstractQuestionId: AbstractQuestionIdFromStringSchema
    }
  }
)

export const CreateAbstractAnswerOptionEndpoint = HttpApiEndpoint.post(
  'Create abstract answer option',
)`/${AbstractQuestionIdParam}/answerOption`.addSuccess(
  AbstractAnswerOptionIdFromNumberSchema,
)

export const AbstractQuestionApiGroup = HttpApiGroup.make('Abstract question')
  .add(CreateAbstractAnswerOptionEndpoint)
  .add(DeleteAbstractQuestionEndpoint)
