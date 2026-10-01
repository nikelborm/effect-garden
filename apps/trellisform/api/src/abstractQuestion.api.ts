/** biome-ignore-all lint/plugin/drizzle: it's not drizzle */
import {
  AbstractAnswerOptionIdFromNumberSchema,
  AbstractQuestionIdFromStringSchema,
} from '@trellisform/model'

import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/http-api/HttpApiGroup'

export const DeleteAbstractQuestionEndpoint = HttpApiEndpoint.delete(
  'Delete abstract question',
  '/:abstractQuestionId',
  {
    params: {
      abstractQuestionId: AbstractQuestionIdFromStringSchema,
    },
  },
)

export const CreateAbstractAnswerOptionEndpoint = HttpApiEndpoint.post(
  'Create abstract answer option',
  '/:abstractQuestionId/answerOption',
  {
    params: {
      abstractQuestionId: AbstractQuestionIdFromStringSchema,
    },
    success: AbstractAnswerOptionIdFromNumberSchema,
  },
)

export const AbstractQuestionApiGroup = HttpApiGroup.make('Abstract question')
  .add(CreateAbstractAnswerOptionEndpoint)
  .add(DeleteAbstractQuestionEndpoint)
