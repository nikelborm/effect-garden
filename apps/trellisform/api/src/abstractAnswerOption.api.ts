/** biome-ignore-all lint/plugin/drizzle: it's not drizzle */
import { AbstractAnswerOptionIdFromStringSchema } from '@trellisform/model'

import * as HttpApiEndpoint from 'effect/unstable/httpapi/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/unstable/httpapi/HttpApiGroup'

export const DeleteAbstractAnswerOptionEndpoint = HttpApiEndpoint.delete(
  'Delete abstract answer option',
  '/:abstractAnswerOptionId',
  {
    params: {
      abstractAnswerOptionId: AbstractAnswerOptionIdFromStringSchema,
    },
  },
)

export const AbstractAnswerOptionApiGroup = HttpApiGroup.make(
  'Abstract answer option',
).add(DeleteAbstractAnswerOptionEndpoint)
