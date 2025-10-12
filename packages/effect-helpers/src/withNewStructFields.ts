import { dual } from 'effect/Function'
import * as Schema from 'effect/Schema'
import * as SchemaAST from 'effect/SchemaAST'
import * as Struct from 'effect/Struct'

export type GetFields<T> = T extends Schema.Struct<infer fields>
  ? fields
  : never

export const withNewStructFields: {
  // data-last
  <NewFields extends Schema.Struct.Fields>(
    newFields: NewFields,
  ): <Self extends Schema.Struct<any>>(
    self: Self,
  ) => Schema.Struct<Omit<GetFields<Self>, keyof NewFields> & NewFields>
  // data-first
  <Self extends Schema.Struct<any>, NewFields extends Schema.Struct.Fields>(
    self: Self,
    newFields: NewFields,
  ): Schema.Struct<Omit<GetFields<Self>, keyof NewFields> & NewFields>
} = dual(2, (self, newFields) =>
  Schema.Struct({
    ...(self.fields as Omit<typeof self.fields, keyof typeof newFields>),
    ...newFields,
  }).annotations(
    Struct.omit(SchemaAST.IdentifierAnnotationId)(self.ast.annotations),
  ),
)
