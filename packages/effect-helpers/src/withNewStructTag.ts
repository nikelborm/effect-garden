import { Schema } from 'effect'
import { dual } from 'effect/Function'

import { type GetFields, withNewStructFields } from './withNewStructFields.ts'
import type { EnsureStruct } from './withOpenApiAnnotations.ts'

export const withNewStructTag: {
  // data-last
  <const NewTag extends string>(
    newTag: NewTag,
  ): <Self extends Schema.Struct<any>>(
    self: Self,
  ) => EnsureStruct<
    Schema.Struct<
      Omit<GetFields<Self>, '_tag'> & {
        _tag: Schema.tag<NewTag>
      }
    >,
    never
  >
  // data-first
  <Self extends Schema.Struct<any>, const NewTag extends string>(
    self: Self,
    newTag: NewTag,
  ): EnsureStruct<
    Schema.Struct<
      Omit<GetFields<Self>, '_tag'> & {
        _tag: Schema.tag<NewTag>
      }
    >,
    never
  >
} = dual(2, (self, newTag) =>
  withNewStructFields(self, {
    _tag: Schema.tag(newTag),
  }),
)
