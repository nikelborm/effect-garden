import {
  withOpenApiAnnotationsForStructs as _withOpenApiAnnotations,
  withNewStructTag,
} from '@evadev/effect-helpers'
import {
  EducationalSpaceIdFromStringSchema,
  EducationalSpaceSchema,
} from '@trellisform/model'

import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from '@effect/platform'
import { Schema } from 'effect'

const withOpenApiAnnotations = _withOpenApiAnnotations('@trellisform/api')

export const EducationalSpaceIdParam = HttpApiSchema.param(
  'educationalSpaceId',
  EducationalSpaceIdFromStringSchema,
)

export const CreateEducationalSpaceRequestSchema = EducationalSpaceSchema.omit(
  'id',
).pipe(
  withNewStructTag('CreateEducationalSpaceRequest'),
  withOpenApiAnnotations({
    title: 'Запрос на создание образовательного пространства',
    description: '',
  }),
)

export const CreateEducationalSpaceResponseSchema = EducationalSpaceSchema

export const CreateEducationalSpaceEndpoint = HttpApiEndpoint.post(
  'Create educational space',
  '/',
)
  .setPayload(CreateEducationalSpaceRequestSchema)
  .setHeaders(Schema.Struct({}))
  .addSuccess(CreateEducationalSpaceResponseSchema)

export const GetSpacesTheAuthedUserHaveRightToLaunchTestIn =
  HttpApiEndpoint.get(
    'Get educational spaces the authed user have the rights to launch tests in',
    '/spacesAvailableForLaunchingTests',
  )
    .setPayload(Schema.Any)
    .addSuccess(Schema.JsonNumber)

export const EducationalSpaceApiGroup = HttpApiGroup.make('Educational space')
  .add(CreateEducationalSpaceEndpoint)
  .add(GetSpacesTheAuthedUserHaveRightToLaunchTestIn)
