import {
  AbstractAnswerOptionIdFromStringSchema,
  AbstractAnswerOptionSchema,
} from '@trellisform/model'

import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from '@effect/platform'
import { Schema } from 'effect'

export const AbstractAnswerOptionIdParam = HttpApiSchema.param(
  'abstractAnswerOptionId',
  AbstractAnswerOptionIdFromStringSchema,
)

export const DeleteAbstractAnswerOptionEndpoint = HttpApiEndpoint.del(
  'Delete abstract answer option',
)`/${AbstractAnswerOptionIdParam}`

export const AbstractAnswerOptionApiGroup = HttpApiGroup.make(
  'Abstract answer option',
).add(DeleteAbstractAnswerOptionEndpoint)
