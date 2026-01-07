import { identity, Option, Schema, type SchemaAST } from 'effect'
import {
  getDefaultAnnotation,
  getDescriptionAnnotation,
  getExamplesAnnotation,
  getTitleAnnotation,
} from 'effect/SchemaAST'

import type {
  CommonAnnotationMap,
  CommonAnnotationMapKeys,
} from './withSchemaAnnotation.ts'

export const changeEncodedTypeToString = <T>(
  TargetFromNumberSchema: Schema.Schema<T, number, never>,
): Schema.Schema<T, string, never> => {
  const copyAnnotation = copyAnnotationFrom(TargetFromNumberSchema.ast)

  return Schema.String.pipe(
    copyAnnotation(getDescriptionAnnotation, 'description'),
    copyAnnotation(getTitleAnnotation, 'title'),
    copyAnnotation(
      getExamplesAnnotation,
      'examples',
      Schema.NumberFromString.pipe(
        Schema.NonEmptyArray,
        Schema.encodeUnknownSync,
      ),
    ),
    copyAnnotation(
      getDefaultAnnotation,
      'default',
      Schema.encodeUnknownSync(Schema.NumberFromString),
    ),
    Schema.parseNumber,
    Schema.compose(TargetFromNumberSchema),
    Schema.asSchema,
  )
}

const copyAnnotationFrom =
  (annotated: SchemaAST.Annotated) =>
  <
    Key extends CommonAnnotationMapKeys<string>,
    AnnotationReturn extends CommonAnnotationMap<unknown>[Key],
    TransformationReturn extends CommonAnnotationMap<string>[Key],
  >(
    getAnnotation: (
      annotated: SchemaAST.Annotated,
    ) => Option.Option<AnnotationReturn>,
    keyToSet: Key,
    valueTransformer: (
      annotation: NoInfer<AnnotationReturn>,
    ) => TransformationReturn = v => v as unknown as TransformationReturn,
  ) =>
    Option.match(getAnnotation(annotated), {
      onSome: val => self =>
        self.annotations({ [keyToSet]: valueTransformer(val) }),
      onNone: () => identity<typeof Schema.String>,
    })
