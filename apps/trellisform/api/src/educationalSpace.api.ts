import {
  withOpenApiAnnotationsForStructs as _withOpenApiAnnotations,
  withNewStructTag,
} from '@evadev/effect-helpers'
import {
  EducationalSpaceSchema,
} from '@trellisform/model'

import * as Schema from 'effect/Schema'
import * as HttpApiEndpoint from 'effect/unstable/httpapi/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/unstable/httpapi/HttpApiGroup'

import { omitStruct } from './omitStruct.ts'

const withOpenApiAnnotations = _withOpenApiAnnotations('@trellisform/api')

export const CreateEducationalSpaceRequestSchema = omitStruct(
  EducationalSpaceSchema,
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
  {
    payload: CreateEducationalSpaceRequestSchema,
    success: CreateEducationalSpaceResponseSchema,
  },
)

export const GetSpacesTheAuthedUserHaveRightToLaunchTestIn =
  HttpApiEndpoint.get(
    'Get educational spaces the authed user have the rights to launch tests in',
    '/spacesAvailableForLaunchingTests',
    {
      success: Schema.Finite,
    },
  )

export const EducationalSpaceApiGroup = HttpApiGroup.make('Educational space')
  .add(CreateEducationalSpaceEndpoint)
  .add(GetSpacesTheAuthedUserHaveRightToLaunchTestIn)
