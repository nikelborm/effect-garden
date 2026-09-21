import * as Schema from 'effect/Schema'

export const changeEncodedTypeToString = <T>(
  TargetFromNumberSchema: Schema.Codec<T, number>,
): Schema.Codec<T, string> => {
  const annotations = Schema.resolveAnnotations(TargetFromNumberSchema)

  const result = Schema.NumberFromString.pipe(
    Schema.decodeTo(TargetFromNumberSchema as Schema.Constraint),
  )

  return result.annotate({
    ...(annotations?.title !== undefined ? { title: annotations.title } : {}),
    ...(annotations?.description !== undefined
      ? { description: annotations.description }
      : {}),
    ...(annotations?.examples !== undefined
      ? { examples: annotations.examples as ReadonlyArray<T> }
      : {}),
    ...(annotations?.default !== undefined
      ? { default: annotations.default as T }
      : {}),
  }) as unknown as Schema.Codec<T, string>
}
