import { AbstractAnswerOptionIdFromStringSchema } from '@trellisform/model'

import * as HttpApiEndpoint from 'effect/unstable/httpapi/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/unstable/httpapi/HttpApiGroup'
import * as HttpApiSchema from 'effect/unstable/httpapi/HttpApiSchema'

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
