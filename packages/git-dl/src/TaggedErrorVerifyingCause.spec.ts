import { outdent } from 'outdent'
import { assert, type Equals } from 'tsafe'

import { describe, it } from '@effect/vitest'
import { right } from 'effect/Either'
import { ParseError, Unexpected } from 'effect/ParseResult'

import { FailedToParseGitLFSInfoError } from './getPathContents/index.ts'
import { InconsistentExpectedAndRealContentSizeError } from './getPathContents/parseGitLFSObjectEither.ts'
import {
  buildTaggedErrorClassVerifyingCause,
  type GetValueByKey,
} from './TaggedErrorVerifyingCause.ts'

describe('TaggedErrorVerifyingCause', { concurrent: true }, () => {
  it('Should have expected fields from both contexts: dynamic and static ', ctx => {
    const dynamicContext = {
      actual: 12,
      expected: 13,
      gitLFSInfo: right({
        oidSha256: 'iosdvhksjsl',
        size: 14,
        version: 'lakdvfhjaljskhk',
      }),
    } as const

    const error = new InconsistentExpectedAndRealContentSizeError(
      dynamicContext,
    )

    ctx
      .expect(error)
      .toBeInstanceOf(InconsistentExpectedAndRealContentSizeError)

    const extractedNeedFields = (({
      actual,
      _tag,
      name,
      message,
      expected,
      gitLFSInfo,
      comment,
    }) => ({
      actual,
      _tag,
      name,
      message,
      expected,
      gitLFSInfo,
      comment,
    }))(error)

    ctx.expect(extractedNeedFields).toEqual({
      _tag: 'InconsistentExpectedAndRealContentSizeError',
      name: 'InconsistentExpectedAndRealContentSizeError',
      message: 'Got file with size 12 bytes while expecting 13 bytes',
      comment: outdent({ newline: ' ' })`
        If we weren't successful in parsing it as git LFS object
        announcement using RegExp and Effect.Schema, we just do a basic size
        consistency check. The check implements the second marker of it
        being a Git LFS object as a backup to checking does "content" look
        like a Git LFS object. If GitHub API's "size" field is different
        from actual size of "content" field, it means either our schema with
        regexp fucked up, or GitHub API did. If it doesn't throw, it means
        there's no reason to assume it's a Git LFS object.
      `,
      ...dynamicContext,
    })
  })

  it('Should throw when incorrect cause provided during constructor call', ctx => {
    try {
      const error = new FailedToParseGitLFSInfoError(
        new Error('bad error') as ParseError,
        {
          partOfContentThatCouldBeGitLFSInfo:
            'Part of content that could be git lfs info',
        },
      )
      throw new Error(
        "new FailedToParseGitLFSInfoError(...) should throw, but didn't",
        { cause: error },
      )
    } catch (error) {
      ctx.expect(error).toBeInstanceOf(Error)
      ctx
        .expect((error as Error).message)
        .toBe(
          'Provided cause of incorrect type to "FailedToParseGitLFSInfoError" class. Expected cause class: "ParseError"',
        )
    }
  })

  it('Should not try to call message string', ctx => {
    const causeOriginal = new ParseError({
      issue: new Unexpected('asdf'),
    })

    const error = new FailedToParseGitLFSInfoError(causeOriginal, {
      partOfContentThatCouldBeGitLFSInfo:
        'Part of content that could be git lfs info',
    })

    const extractedNeedFields = (({
      _tag,
      name,
      message,
      cause,
      partOfContentThatCouldBeGitLFSInfo,
    }) => ({
      _tag,
      name,
      message,
      cause,
      partOfContentThatCouldBeGitLFSInfo,
    }))(error)

    ctx.expect(extractedNeedFields).toEqual({
      _tag: 'FailedToParseGitLFSInfoError',
      name: 'FailedToParseGitLFSInfoError',
      message: 'Failed to parse git LFS announcement',
      cause: causeOriginal,
      partOfContentThatCouldBeGitLFSInfo:
        'Part of content that could be git lfs info',
    })
  })

  it('Should pass cause and full context when message renderer is called and ExpectedCauseClass is provided', ctx => {
    class CustomCauseErrorClass extends Error {
      constructor(message: string) {
        super(message)
        this.name = this.constructor.name
      }
    }

    class CustomTaggedError extends buildTaggedErrorClassVerifyingCause<{
      dynamicContextField1: string
    }>()(
      'CustomTaggedError',
      (cause, fullContext) =>
        [
          cause.name,
          cause.message,
          fullContext.dynamicContextField1,
          fullContext.staticContextField2,
        ].join(','),
      CustomCauseErrorClass,
      {
        staticContextField2: 123,
      },
    ) {}

    const causeOriginal = new CustomCauseErrorClass('test message')

    const error = new CustomTaggedError(causeOriginal, {
      dynamicContextField1: 'Dynamic context field1',
    })

    const extractedNeedFields = (({
      _tag,
      name,
      message,
      cause,
      staticContextField2,
      dynamicContextField1,
    }) => ({
      _tag,
      name,
      message,
      cause,
      staticContextField2,
      dynamicContextField1,
    }))(error)

    ctx.expect(extractedNeedFields).toEqual({
      _tag: 'CustomTaggedError',
      name: 'CustomTaggedError',
      message: 'CustomCauseErrorClass,test message,Dynamic context field1,123',
      cause: causeOriginal,
      dynamicContextField1: 'Dynamic context field1',
      staticContextField2: 123,
    })
  })
})

assert<Equals<GetValueByKey<{}, 'StaticContext', 'default'>, 'default'>>
assert<
  Equals<
    GetValueByKey<{ StaticContext: never }, 'StaticContext', 'default'>,
    'default'
  >
>
assert<
  Equals<
    GetValueByKey<{ StaticContext?: never }, 'StaticContext', 'default'>,
    'default'
  >
>
assert<
  Equals<GetValueByKey<{ StaticContext: {} }, 'StaticContext', 'default'>, {}>
>
assert<
  Equals<GetValueByKey<{ StaticContext?: {} }, 'StaticContext', 'default'>, {}>
>
assert<
  Equals<
    GetValueByKey<
      { StaticContext: {} | undefined },
      'StaticContext',
      'default'
    >,
    {}
  >
>
assert<
  Equals<
    GetValueByKey<
      { StaticContext?: {} | undefined },
      'StaticContext',
      'default'
    >,
    {}
  >
>
assert<
  Equals<
    GetValueByKey<
      { StaticContext: Record<string, unknown> },
      'StaticContext',
      'default'
    >,
    Record<string, unknown>
  >
>
assert<
  Equals<
    GetValueByKey<
      { StaticContext?: Record<string, unknown> },
      'StaticContext',
      'default'
    >,
    Record<string, unknown>
  >
>
assert<
  Equals<
    GetValueByKey<
      { StaticContext: Record<string, unknown> | undefined },
      'StaticContext',
      'default'
    >,
    Record<string, unknown>
  >
>
assert<
  Equals<
    GetValueByKey<
      { StaticContext?: Record<string, unknown> | undefined },
      'StaticContext',
      'default'
    >,
    Record<string, unknown>
  >
>
assert<
  Equals<
    GetValueByKey<{ StaticContext: undefined }, 'StaticContext', 'default'>,
    'default'
  >
>
assert<
  Equals<
    GetValueByKey<{ StaticContext?: undefined }, 'StaticContext', 'default'>,
    'default'
  >
>
assert<
  Equals<
    GetValueByKey<{ StaticContext: { asd: 123 } }, 'StaticContext', 'default'>,
    { asd: 123 }
  >
>
assert<
  Equals<
    GetValueByKey<{ StaticContext?: { asd: 123 } }, 'StaticContext', 'default'>,
    { asd: 123 }
  >
>
assert<
  Equals<
    GetValueByKey<
      { StaticContext: { asd: 123 } | undefined },
      'StaticContext',
      'default'
    >,
    { asd: 123 }
  >
>
assert<
  Equals<
    GetValueByKey<
      { StaticContext?: { asd: 123 } | undefined },
      'StaticContext',
      'default'
    >,
    { asd: 123 }
  >
>
assert<
  Equals<
    GetValueByKey<{ irrelevant: 'str' }, 'StaticContext', 'default'>,
    'default'
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext: never },
      'StaticContext',
      'default'
    >,
    'default'
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext?: never },
      'StaticContext',
      'default'
    >,
    'default'
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext: {} },
      'StaticContext',
      'default'
    >,
    {}
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext?: {} },
      'StaticContext',
      'default'
    >,
    {}
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext: {} | undefined },
      'StaticContext',
      'default'
    >,
    {}
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext?: {} | undefined },
      'StaticContext',
      'default'
    >,
    {}
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext: Record<string, unknown> },
      'StaticContext',
      'default'
    >,
    Record<string, unknown>
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext?: Record<string, unknown> },
      'StaticContext',
      'default'
    >,
    Record<string, unknown>
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext: Record<string, unknown> | undefined },
      'StaticContext',
      'default'
    >,
    Record<string, unknown>
  >
>
assert<
  Equals<
    GetValueByKey<
      {
        irrelevant: 'str'
        StaticContext?: Record<string, unknown> | undefined
      },
      'StaticContext',
      'default'
    >,
    Record<string, unknown>
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext: undefined },
      'StaticContext',
      'default'
    >,
    'default'
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext?: undefined },
      'StaticContext',
      'default'
    >,
    'default'
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext: { asd: 123 } },
      'StaticContext',
      'default'
    >,
    { asd: 123 }
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext?: { asd: 123 } },
      'StaticContext',
      'default'
    >,
    { asd: 123 }
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext: { asd: 123 } | undefined },
      'StaticContext',
      'default'
    >,
    { asd: 123 }
  >
>
assert<
  Equals<
    GetValueByKey<
      { irrelevant: 'str'; StaticContext?: { asd: 123 } | undefined },
      'StaticContext',
      'default'
    >,
    { asd: 123 }
  >
>
