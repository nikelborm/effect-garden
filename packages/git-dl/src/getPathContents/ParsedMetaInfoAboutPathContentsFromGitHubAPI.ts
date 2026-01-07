import { gen } from 'effect/Effect'
import { mapLeft } from 'effect/Either'
import { ParseError } from 'effect/ParseResult'
import {
  Array as ArraySchema,
  decodeUnknownEither,
  Literal,
  Number as SchemaNumber,
  String as SchemaString,
  Struct,
  Union,
} from 'effect/Schema'

import {
  buildTaggedErrorClassVerifyingCause,
  type TaggedErrorClass,
} from '../TaggedErrorVerifyingCause.ts'
import { RepoPathContentsFromGitHubAPI } from './RepoPathContentsFromGitHubAPI.ts'

export const UnparsedMetaInfoAboutPathContentsFromGitHubAPI =
  RepoPathContentsFromGitHubAPI('object')

export const ParsedMetaInfoAboutPathContentsFromGitHubAPI = gen(function* () {
  const response = yield* UnparsedMetaInfoAboutPathContentsFromGitHubAPI

  return yield* mapLeft(
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
  size: SchemaNumber,
  name: SchemaString,
  path: SchemaString,
  sha: SchemaString,
}

const dirLiteral = Literal('dir')
const nonDirLiterals = Literal('file', 'submodule', 'symlink')

export const ResponseSchema = Union(
  Struct({
    type: Literal('dir'),
    entries: Struct({
      type: Union(dirLiteral, nonDirLiterals),
      ...GitSomethingFields,
    }).pipe(ArraySchema),
    ...GitSomethingFields,
  }),
  Struct({
    type: Literal('file'),
    encoding: Literal('base64', 'none'),
    content: SchemaString,
    ...GitSomethingFields,
  }),
)

const decodeResponse = decodeUnknownEither(ResponseSchema, {
  exact: true,
})

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference

const _1: TaggedErrorClass<{
  ErrorName: 'FailedToParseResponseFromRepoPathContentsMetaInfoAPI'
  ExpectedCauseClass: typeof ParseError
  DynamicContext: { response: unknown }
}> = buildTaggedErrorClassVerifyingCause<{ response: unknown }>()(
  'FailedToParseResponseFromRepoPathContentsMetaInfoAPI',
  `Failed to parse response from repo path contents meta info API`,
  ParseError,
)

export class FailedToParseResponseFromRepoPathContentsMetaInfoAPIError extends _1 {}
