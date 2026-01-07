import { outdent } from 'outdent'

import { type Either, gen, isRight, left, mapLeft } from 'effect/Either'
import { ParseError } from 'effect/ParseResult'
import {
  decodeUnknownEither,
  NonEmptyTrimmedString,
  NumberFromString,
  Struct,
} from 'effect/Schema'

import {
  buildTaggedErrorClassVerifyingCause,
  type TaggedErrorClass,
} from '../TaggedErrorVerifyingCause.ts'

export const parseGitLFSObjectEither = ({
  contentAsBuffer,
  expectedContentSize,
}: {
  contentAsBuffer: Buffer<ArrayBuffer>
  expectedContentSize: number
}) =>
  gen(function* () {
    // gitLFS info usually is no longer than MAX_GIT_LFS_INFO_SIZE bytes
    const contentAsString = contentAsBuffer
      .subarray(0, MAX_GIT_LFS_INFO_SIZE)
      .toString('utf8')

    const parsingResult = mapLeft(
      decodeGitLFSInfoSchema(contentAsString.match(gitLFSInfoRegexp)?.groups),
      cause =>
        new FailedToParseGitLFSInfoError(cause, {
          partOfContentThatCouldBeGitLFSInfo: contentAsString,
        }),
    )

    const matchedByRegexpAndParsedByEffectSchema = isRight(parsingResult)
    const doesSizeFromGitLFSInfoAlignWithExpectedContentSize =
      isRight(parsingResult) && parsingResult.right.size === expectedContentSize

    const shouldFailIfItIsNotGitLFS =
      contentAsBuffer.byteLength !== expectedContentSize

    const isThisAGitLFSObject =
      matchedByRegexpAndParsedByEffectSchema &&
      doesSizeFromGitLFSInfoAlignWithExpectedContentSize

    if (isThisAGitLFSObject)
      return {
        gitLFSObjectIdSha256: parsingResult.right.oidSha256,
        gitLFSVersion: parsingResult.right.version,
      } as const

    if (shouldFailIfItIsNotGitLFS)
      return yield* left(
        new InconsistentExpectedAndRealContentSizeError({
          actual: contentAsBuffer.byteLength,
          expected: expectedContentSize,
          gitLFSInfo: parsingResult,
        }),
      )

    return 'This is not a git LFS object' as const
  })

// there are some responses that look like
// `version https://git-lfs.github.com/spec/v1
// oid sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// size 128
// `
// and the only variable thing in it is the size at the end, and I assume
// that supported file size is not greater than 100 GB
const MAX_GIT_LFS_INFO_SIZE = 137
// Don't add regexp /g modifier, it breaks match groups
const gitLFSInfoRegexp =
  /^version (?<version>https:\/\/git-lfs\.github\.com\/spec\/v1)\noid sha256:(?<oidSha256>[0-9a-f]{64})\nsize (?<size>[1-9]\d{0,11})\n$/m

const GitLFSInfoSchema = Struct({
  version: NonEmptyTrimmedString,
  oidSha256: NonEmptyTrimmedString,
  size: NumberFromString,
})

const decodeGitLFSInfoSchema = decodeUnknownEither(GitLFSInfoSchema, {
  exact: true,
})

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
export type FailedToParseGitLFSInfoErrorClass = TaggedErrorClass<{
  ErrorName: 'FailedToParseGitLFSInfoError'
  ExpectedCauseClass: typeof ParseError
  DynamicContext: { partOfContentThatCouldBeGitLFSInfo: string }
}>

const _1: FailedToParseGitLFSInfoErrorClass =
  buildTaggedErrorClassVerifyingCause<{
    partOfContentThatCouldBeGitLFSInfo: string
  }>()(
    'FailedToParseGitLFSInfoError',
    `Failed to parse git LFS announcement`,
    ParseError,
  )

export class FailedToParseGitLFSInfoError extends _1 {}

type InconsistentSizesDynamicContext = {
  actual: number
  expected: number
  gitLFSInfo: Either<
    Readonly<{
      version: string
      oidSha256: string
      size: number
    }>,
    InstanceType<FailedToParseGitLFSInfoErrorClass>
  >
}

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference

export const _2: TaggedErrorClass<{
  ErrorName: 'InconsistentExpectedAndRealContentSizeError'
  StaticContext: { comment: string }
  DynamicContext: InconsistentSizesDynamicContext
}> = buildTaggedErrorClassVerifyingCause<InconsistentSizesDynamicContext>()(
  'InconsistentExpectedAndRealContentSizeError',
  ctx =>
    `Got file with size ${ctx.actual} bytes while expecting ${ctx.expected} bytes`,
  void 0,
  {
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
  },
)

export class InconsistentExpectedAndRealContentSizeError extends _2 {}
