import { dual, pipe } from 'effect/Function'
import type { Annotable, Annotations } from 'effect/Schema'

export const withSchemaAnnotation = <const T extends CommonAnnotationMapKeys>(
  annotationField: T,
) =>
  dual<
    // data-last
    <S extends Annotable.All>(
      annotationValue: Exclude<CommonAnnotationMap[T], undefined>,
    ) => (self: S) => Annotable.Self<S>,
    // data-first
    <S extends Annotable.All>(
      self: S,
      annotationValue: Exclude<CommonAnnotationMap[T], undefined>,
    ) => Annotable.Self<S>
  >(2, (self, annotationValue) =>
    self.annotations({ [annotationField]: annotationValue }),
  )

type Is<A, ExtendsB> = [A] extends [ExtendsB] ? true : false

export type GeneralAnnotationsMap<T = any> = Annotations.GenericSchema<T>

export type CommonAnnotationMap<T = any> = {
  [K in keyof GeneralAnnotationsMap<T> as [
    Is<string, K> | Is<number, K> | Is<symbol, K>,
  ] extends [false]
    ? K
    : never]: GeneralAnnotationsMap<T>[K]
}

export type CommonAnnotationMapKeys<T = any> = keyof CommonAnnotationMap<T>

export const withTitleSchemaAnnotation = withSchemaAnnotation('title')

export const withDescriptionSchemaAnnotation =
  withSchemaAnnotation('description')

export const withIdentifierSchemaAnnotation = withSchemaAnnotation('identifier')

export const withSchemaIdSchemaAnnotation = withSchemaAnnotation('schemaId')

export const withSchemaIdAndIdentifierAnnotations = (prefix: string) => {
  const annotate = (self: any, identifier: string) => {
    const prefixedId = `${prefix}/${identifier}`

    return pipe(
      self,
      withSchemaIdSchemaAnnotation(prefixedId),
      withIdentifierSchemaAnnotation(prefixedId),
    )
  }

  return ((...args: any[]) => {
    if (args.length >= 2) return annotate(args[0], args[1])
    return (self: any) => annotate(self, args[0])
  }) as typeof withIdentifierSchemaAnnotation
}
