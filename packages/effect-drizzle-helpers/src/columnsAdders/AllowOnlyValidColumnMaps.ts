import { type PgColumnBuilderBase } from 'drizzle-orm/pg-core';

const ErrorMessageBrand = Symbol();

export type ErrMsg<Message extends string, Context = any> = {
  message: Message;
  brand: typeof ErrorMessageBrand;
  context: Context;
};

export type ColumnMap<Keys extends string> = Record<Keys, PgColumnBuilderBase>;
export type GeneralColumnMap = ColumnMap<string>;

// TODO: make all validation sound with runtime execution

export type AllowOnlyNonEmptyObjectsWithActualKeys<
  ValueToValidate,
  ExpectedRecordValue = any,
> = [
  AllowOnlyNonEmptyLiteralStringKeys<AllowOnlyNonEmptyObjects<ValueToValidate>>,
] extends [infer U extends ErrMsg<string>]
  ? U
  : Record<string, ExpectedRecordValue>;

type AllowOnlyNonEmptyLiteralStringKeys<ValueToValidate> =
  ForbidEmptyStringKeys<
    ForbidNonLiteralStringKeys<ForbidNonStringKeys<ValueToValidate>>
  >;

type AllowOnlyNonEmptyObjects<ValueToValidate> = ForbidNonEmptyObject<
  ForbidNonObjects<ValueToValidate>
>;

type ForbidNonEmptyObject<ValueToValidate> = keyof ValueToValidate extends never
  ? ErrMsg<'Cannot be empty object', ValueToValidate>
  : ValueToValidate;

type ForbidNonLiteralStringKeys<ValueToValidate> =
  string extends keyof ValueToValidate
    ? ErrMsg<
        'Object parameter keys cannot be general strings, they should be specific string literals',
        ValueToValidate
      >
    : ValueToValidate;

type ForbidNonObjects<ValueToValidate> = [ValueToValidate] extends [
  Record<symbol | string | number, any>,
]
  ? ValueToValidate
  : ErrMsg<'Should be an object', ValueToValidate>;

type ForbidEmptyStringKeys<ValueToValidate> = keyof ValueToValidate extends ''
  ? ErrMsg<'Object parameter keys cannot be empty string, ValueToValidate'>
  : ValueToValidate;

type ForbidNonStringKeys<ValueToValidate> = keyof ValueToValidate extends
  | number
  | symbol
  | boolean
  | undefined
  | null
  ? ErrMsg<
      'Object parameter keys should be only strings and only literals, and not number, symbol, boolean, undefined or null',
      ValueToValidate
    >
  : ValueToValidate;

export type AllowOnlyValidColumnMaps<T> =
  AllowOnlyNonEmptyObjectsWithActualKeys<T, PgColumnBuilderBase>;
