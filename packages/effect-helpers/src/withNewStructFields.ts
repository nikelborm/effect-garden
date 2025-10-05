import { Schema } from 'effect';
import { dual } from 'effect/Function';
import type { Struct } from 'effect/Schema';

export type GetFields<T> = T extends Struct<infer fields> ? fields : never;

export const withNewStructFields: {
  // data-last
  <NewFields extends Schema.Struct.Fields>(
    newFields: NewFields,
  ): <Self extends Schema.Struct<any>>(
    self: Self,
  ) => Schema.Struct<Omit<GetFields<Self>, keyof NewFields> & NewFields>;
  // data-first
  <Self extends Schema.Struct<any>, NewFields extends Schema.Struct.Fields>(
    self: Self,
    newFields: NewFields,
  ): Schema.Struct<Omit<GetFields<Self>, keyof NewFields> & NewFields>;
} = dual(2, (self, newFields) =>
  Schema.Struct({
    ...(self.fields as Omit<typeof self.fields, keyof typeof newFields>),
    ...newFields,
  }).annotations(self.ast.annotations),
);
