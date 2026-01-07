import type { Schema } from 'effect'

import { dual } from 'effect/Function'
import type { Struct } from 'effect/Schema'

import { withInferredFromTagIdentifierSchemaAnnotationSync } from './withInferredFromTagIdentifierSchemaAnnotation.ts'

type EveryDebugStatus = 'debug enabled' | 'debug disabled'
type EverySkipTagValidationStatus =
  | 'yay, everything is secure'
  | 'typescript is stupid'

export type EnsureTaggedStructWithStringLiteral<
  Self,
  FallbackValue = Schema.Struct<any>,
  DebugStatus extends EveryDebugStatus = 'debug disabled',
  PatheticallySkipTagValidation extends
    EverySkipTagValidationStatus = 'yay, everything is secure',
> = [Self] extends [infer S]
  ? [S] extends [Struct<infer Fields>]
    ? [PatheticallySkipTagValidation] extends ['yay, everything is secure']
      ? [Fields] extends [{ _tag: infer Tag }]
        ? [Tag] extends [Schema.tag<infer StringLiteralTag>]
          ? [StringLiteralTag] extends [string]
            ? [string] extends [StringLiteralTag]
              ? Failure<
                  FallbackValue,
                  'unexpectedly succeeded: [string] extends [StringLiteralTag]',
                  { stringLiteral: StringLiteralTag },
                  DebugStatus
                >
              : Success<
                  S,
                  `yay!`,
                  { stringLiteral: StringLiteralTag },
                  DebugStatus
                >
            : Failure<
                FallbackValue,
                'failed: [StringLiteralTag] extends [string]',
                { stringLiteral: StringLiteralTag },
                DebugStatus
              >
          : Failure<
              FallbackValue,
              'failed: [Tag] extends [Schema.tag<infer StringLiteralTag>]',
              { tag: Tag },
              DebugStatus
            >
        : Failure<
            FallbackValue,
            'failed: [Fields] extends [{ _tag: infer Tag }]',
            { fields: Fields },
            DebugStatus
          >
      : Success<S, `sad pathetic yay!`, { self: S }, DebugStatus>
    : Failure<
        FallbackValue,
        'failed: [S] extends [Struct<infer Fields>]',
        { self: S },
        DebugStatus
      >
  : never

type Success<
  FallbackValue,
  Message extends string,
  DebugInfo extends object,
  DebugStatus extends EveryDebugStatus = 'debug disabled',
> = Fallback<
  FallbackValue,
  Message,
  DebugInfo & { success: FallbackValue },
  'success',
  DebugStatus
>

type Failure<
  FallbackValue,
  Message extends string,
  DebugInfo extends object,
  DebugStatus extends EveryDebugStatus = 'debug disabled',
> = Fallback<FallbackValue, Message, DebugInfo, 'failure', DebugStatus>

type Fallback<
  FallbackValue,
  Message extends string,
  DebugInfo extends object,
  ResultStatus extends 'success' | 'failure' = 'failure',
  DebugStatus extends EveryDebugStatus = 'debug disabled',
> = [DebugStatus] extends ['debug enabled']
  ? [ResultStatus] extends ['failure']
    ? { message: Message; info: DebugInfo }
    : FallbackValue
  : FallbackValue

export type EnsureStruct<
  Self,
  FallbackValue = Schema.Struct<any>,
  DebugStatus extends EveryDebugStatus = 'debug disabled',
> = [Self] extends [infer S]
  ? [S] extends [Struct<infer Fields>]
    ? [Fields] extends [Schema.Struct.Fields]
      ? Success<S, 'Yay!', { fields: Fields }, DebugStatus>
      : Failure<
          FallbackValue,
          'failed: [Fields] extends [Schema.Struct.Fields]',
          { fields: Fields },
          DebugStatus
        >
    : Failure<
        FallbackValue,
        'failed: [S] extends [Struct<infer Fields>]',
        { self: S },
        DebugStatus
      >
  : never

export const withOpenApiAnnotationsForStructs = (
  prefix: string,
): {
  // data-last
  (annotations: {
    title: string
    description: string
  }): <Self extends Schema.Struct<any>>(
    self: Self,
  ) => EnsureTaggedStructWithStringLiteral<Self, never>
  // data-first
  <Self extends Schema.Struct<any>>(
    self: Self,
    annotations: {
      title: string
      description: string
    },
  ): EnsureTaggedStructWithStringLiteral<Self, never>
} =>
  dual(
    2,
    <Self extends Schema.Struct<any>>(
      self: Self,
      annotations: {
        title: string
        description: string
      },
    ): EnsureTaggedStructWithStringLiteral<Self, never> =>
      withInferredFromTagIdentifierSchemaAnnotationSync(
        self.annotations(annotations) as Self,
        prefix,
      ),
  )
