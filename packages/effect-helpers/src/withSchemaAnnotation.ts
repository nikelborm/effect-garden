import { dual } from 'effect/Function'
import type * as Schema from 'effect/Schema'

export const withSchemaAnnotation = <const T extends CommonAnnotationMapKeys>(
  annotationField: T,
) =>
  dual<
    // data-last
    (
      annotationValue: string,
    ) => <S extends Schema.Top>(self: S) => S['Rebuild'],
    // data-first
    <S extends Schema.Top>(self: S, annotationValue: string) => S['Rebuild']
  >(
    2,
    (self, annotationValue) =>
      (self as Schema.Top).annotateKey({
        [annotationField]: annotationValue,
      }) as never,
  )

export type CommonAnnotationMapKeys = 'title' | 'description' | 'identifier'

export type CommonAnnotationMap<T = string> = Record<CommonAnnotationMapKeys, T>

export const withTitleSchemaAnnotation = withSchemaAnnotation('title')

export const withDescriptionSchemaAnnotation =
  withSchemaAnnotation('description')

export const withIdentifierSchemaAnnotation = withSchemaAnnotation('identifier')

export const withSchemaIdAndIdentifierAnnotations = (prefix: string) => {
  const annotate = (self: Schema.Top, identifier: string) => {
    const prefixedId = `${prefix}/${identifier}`

    return (self as Schema.Top).annotateKey({
      identifier: prefixedId,
    }) as never
  }

  return ((...args: any[]) => {
    if (args.length >= 2) return annotate(args[0], args[1])
    return (self: any) => annotate(self, args[0])
  }) as typeof withIdentifierSchemaAnnotation
}
