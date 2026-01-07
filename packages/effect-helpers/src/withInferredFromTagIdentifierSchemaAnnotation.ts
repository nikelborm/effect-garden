import { Either, ParseResult, type Schema, SchemaAST } from 'effect'
import { dual } from 'effect/Function'

import type { EnsureTaggedStructWithStringLiteral } from './withOpenApiAnnotations.ts'

export const withInferredFromTagIdentifierSchemaAnnotationEither: {
  // data-last
  (
    prefix: string,
  ): <Self extends Schema.Struct<any>>(
    self: Self,
  ) => Either.Either<
    EnsureTaggedStructWithStringLiteral<Self, never>,
    ParseResult.ParseIssue
  >
  // data-first
  <Self extends Schema.Struct<any>>(
    self: Self,
    prefix: string,
  ): Either.Either<
    EnsureTaggedStructWithStringLiteral<Self, never>,
    ParseResult.ParseIssue
  >
} = dual(
  2,
  <Self extends Schema.Struct<any>>(
    self: Self,
    prefix: string,
  ): Either.Either<
    EnsureTaggedStructWithStringLiteral<Self, never>,
    ParseResult.ParseIssue
  > => {
    const ast = self.ast

    if (!SchemaAST.isTypeLiteral(ast))
      return ParseResult.fail(
        new ParseResult.Type(
          ast,
          ast._tag,
          'Argument of withInferredFromTagIdentifierSchemaAnnotationEither is not type literal',
        ),
      )

    const tagPropertySignature = ast.propertySignatures.find(
      s => s.name === '_tag',
    )

    if (
      !tagPropertySignature ||
      !SchemaAST.isLiteral(tagPropertySignature.type)
    )
      return ParseResult.fail(
        new ParseResult.Type(
          ast,
          ast._tag,
          `withInferredFromTagIdentifierSchemaAnnotationEither were not able to find tag field in passed struct. Are you sure it's TaggedStruct?`,
        ),
      )

    const tag = tagPropertySignature.type.literal

    return ParseResult.succeed(
      self.annotations({
        identifier: `${prefix}/${tag}`,
      }) as EnsureTaggedStructWithStringLiteral<Self, never>,
    )
  },
)

export const withInferredFromTagIdentifierSchemaAnnotationSync: {
  // data-last
  (
    prefix: string,
  ): <Self extends Schema.Struct<any>>(
    self: Self,
  ) => EnsureTaggedStructWithStringLiteral<Self, never>
  // data-first
  <Self extends Schema.Struct<any>>(
    self: Self,
    prefix: string,
  ): EnsureTaggedStructWithStringLiteral<Self, never>
} = dual(
  2,
  <Self extends Schema.Struct<any>>(
    self: Self,
    prefix: string,
  ): EnsureTaggedStructWithStringLiteral<Self, never> => {
    const result = withInferredFromTagIdentifierSchemaAnnotationEither(
      self,
      prefix,
    )

    if (Either.isLeft(result))
      throw new Error('Failed to infer identifier for OpenApi schema', {
        cause: result.left,
      })

    return result.right
  },
)
