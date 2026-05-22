import {
  AbstractAnswerOptionIdFromStringSchema,
  AbstractAnswerOptionSchema,
} from '@trellisform/model'

import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint'
import * as HttpApiGroup from '@effect/platform/HttpApiGroup'
import * as HttpApiSchema from '@effect/platform/HttpApiSchema'
import * as Schema from 'effect/Schema'

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
