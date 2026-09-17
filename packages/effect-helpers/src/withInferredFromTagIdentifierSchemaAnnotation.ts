import * as EFunction from 'effect/Function'
import * as Result from 'effect/Result'
import type * as Schema from 'effect/Schema'
import * as SchemaAST from 'effect/SchemaAST'
import * as SchemaIssue from 'effect/SchemaIssue'

import type { EnsureTaggedStructWithStringLiteral } from './withOpenApiAnnotations.ts'

export const withInferredFromTagIdentifierSchemaAnnotationResult: {
  // data-last
  (
    prefix: string,
  ): <Self extends Schema.Struct<any>>(
    self: Self,
  ) => Result.Result<
    EnsureTaggedStructWithStringLiteral<Self, never>,
    SchemaIssue.Issue
  >
  // data-first
  <Self extends Schema.Struct<any>>(
    self: Self,
    prefix: string,
  ): Result.Result<
    EnsureTaggedStructWithStringLiteral<Self, never>,
    SchemaIssue.Issue
  >
} = EFunction.dual(
  2,
  <Self extends Schema.Struct<any>>(
    self: Self,
    prefix: string,
  ): Result.Result<
    EnsureTaggedStructWithStringLiteral<Self, never>,
    SchemaIssue.Issue
  > => {
    const ast = self.ast

    if (!SchemaAST.isObjects(ast))
      return Result.fail(
        new SchemaIssue.InvalidValue({
          message:
            'Argument of withInferredFromTagIdentifierSchemaAnnotationResult is not type literal',
        }),
      )

    const tagPropertySignature = ast.propertySignatures.find(
      s => s.name === '_tag',
    )

    if (
      !tagPropertySignature ||
      !SchemaAST.isLiteral(tagPropertySignature.type)
    )
      return Result.fail(
        new SchemaIssue.InvalidValue({
          message: `withInferredFromTagIdentifierSchemaAnnotationResult were not able to find tag field in passed struct. Are you sure it's TaggedStruct?`,
        }),
      )

    const tag = tagPropertySignature.type.literal

    return Result.succeed(
      self.annotate({
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
} = EFunction.dual(
  2,
  <Self extends Schema.Struct<any>>(
    self: Self,
    prefix: string,
  ): EnsureTaggedStructWithStringLiteral<Self, never> => {
    const result = withInferredFromTagIdentifierSchemaAnnotationResult(
      self,
      prefix,
    )

    if (Result.isFailure(result))
      throw new Error('Failed to infer identifier for OpenApi schema', {
        cause: result.failure,
      })

    return result.success
  },
)
