import * as Effect from 'effect/Effect'
import * as Either from 'effect/Either'
import * as ParseResult from 'effect/ParseResult'
import * as Schema from 'effect/Schema'

import {
  buildTaggedErrorClassVerifyingCause,
  type TaggedErrorClass,
} from '../TaggedErrorVerifyingCause.ts'
import { RepoPathContentsFromGitHubAPI } from './RepoPathContentsFromGitHubAPI.ts'

export const UnparsedMetaInfoAboutPathContentsFromGitHubAPI =
  RepoPathContentsFromGitHubAPI('object')

export const ParsedMetaInfoAboutPathContentsFromGitHubAPI = Effect.gen(function* () {
  const response = yield* UnparsedMetaInfoAboutPathContentsFromGitHubAPI

  return yield* Either.mapLeft(
    decodeResponse(response.data),
    parseError =>
      new FailedToParseResponseFromRepoPathContentsMetaInfoAPIError(
        parseError,
        {
          response,
        },
      ),
  )
})

const GitSomethingFields = {
  size: Schema.Number,
  name: Schema.String,
  path: Schema.String,
  sha: Schema.String,
}

const dirLiteral = Schema.Literal('dir')
const nonDirLiterals = Schema.Literal('file', 'submodule', 'symlink')

export const ResponseSchema = Schema.Union(
  Schema.Struct({
    type: Schema.Literal('dir'),
    entries: Schema.Struct({
      type: Schema.Union(dirLiteral, nonDirLiterals),
      ...GitSomethingFields,
    }).pipe(Schema.Array),
    ...GitSomethingFields,
  }),
  Schema.Struct({
    type: Schema.Literal('file'),
    encoding: Schema.Literal('base64', 'none'),
    content: Schema.String,
    ...GitSomethingFields,
  }),
)

const decodeResponse = Schema.decodeUnknownEither(ResponseSchema, {
  exact: true,
})

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference

const _1: TaggedErrorClass<{
  ErrorName: 'FailedToParseResponseFromRepoPathContentsMetaInfoAPI'
  ExpectedCauseClass: typeof ParseResult.ParseError
  DynamicContext: { response: unknown }
}> = buildTaggedErrorClassVerifyingCause<{ response: unknown }>()(
  'FailedToParseResponseFromRepoPathContentsMetaInfoAPI',
  `Failed to parse response from repo path contents meta info API`,
  ParseResult.ParseError,
)

export class FailedToParseResponseFromRepoPathContentsMetaInfoAPIError extends _1 {}
