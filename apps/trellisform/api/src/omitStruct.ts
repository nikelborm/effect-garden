import * as Schema from 'effect/Schema'
import * as Struct from 'effect/Struct'

type AnyStruct = Schema.Struct<any>

export const omitStruct: {
  <const Keys extends ReadonlyArray<PropertyKey>>(
    ...keys: Keys
  ): <Self extends AnyStruct>(self: Self) => Self
  <Self extends AnyStruct>(
    self: Self,
    ...keys: ReadonlyArray<keyof Self['fields'] & PropertyKey>
  ): Self
} = ((...args: Array<any>) => {
  const hasSelf =
    args.length > 1 || (args.length === 1 && Schema.isSchema(args[0] as any))
  if (hasSelf) {
    const [self, ...keys] = args as [AnyStruct, ...Array<PropertyKey>]
    return omitStructImpl(self, keys)
  }
  const keys = args as Array<PropertyKey>
  return (self: AnyStruct) => omitStructImpl(self, keys)
}) as any

const omitStructImpl = (self: AnyStruct, keys: ReadonlyArray<PropertyKey>) => {
  const out = (self as AnyStruct).mapFields((fields: any) =>
    Struct.omit(fields, keys as any),
  ) as any
  const annotations = Schema.resolveAnnotations(self as Schema.Constraint) as
    | { identifier?: string }
    | undefined
  const identifier = annotations?.identifier
  return (identifier ? out.annotate({ identifier }) : out) as any
}
