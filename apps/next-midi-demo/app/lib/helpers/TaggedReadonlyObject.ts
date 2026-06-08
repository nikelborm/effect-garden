export type TaggedReadonlyObject = {
  readonly _tag: string
} & { readonly [k in string]: any }
