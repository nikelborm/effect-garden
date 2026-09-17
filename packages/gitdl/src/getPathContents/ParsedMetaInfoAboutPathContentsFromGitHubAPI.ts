import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Result from 'effect/Result'
import * as Schema from 'effect/Schema'

import {
  buildTaggedErrorClassVerifyingCause,
  type TaggedErrorClass,
} from '../TaggedErrorVerifyingCause.ts'
import { RepoPathContentsFromGitHubAPI } from './RepoPathContentsFromGitHubAPI.ts'

const GitSomethingFields = {
  size: Schema.Number,
  name: Schema.String,
  path: Schema.String,
  sha: Schema.String,
}

const dirLiteral = Schema.Literal('dir')
const nonDirLiterals = Schema.Literals(['file', 'submodule', 'symlink'])

export const ResponseSchema = Schema.Union([
  Schema.Struct({
    type: Schema.Literal('dir'),
    entries: Schema.Struct({
      type: Schema.Union([dirLiteral, nonDirLiterals]),
      ...GitSomethingFields,
    }).pipe(Schema.Array),
    ...GitSomethingFields,
  }),
  Schema.Struct({
    type: Schema.Literal('file'),
    encoding: Schema.Literals(['base64', 'none']),
    content: Schema.String,
    ...GitSomethingFields,
  }),
])

const decodeResponse = Schema.decodeUnknownResult(ResponseSchema)

export const UnparsedMetaInfoAboutPathContentsFromGitHubAPI =
  RepoPathContentsFromGitHubAPI('object')

export const ParsedMetaInfoAboutPathContentsFromGitHubAPI = Effect.flatMap(
  UnparsedMetaInfoAboutPathContentsFromGitHubAPI,
  response =>
    pipe(
      response.data,
      decodeResponse,
      Result.mapError(
        parseError =>
          new FailedToParseResponseFromRepoPathContentsMetaInfoAPIError(
            parseError,
            { response },
          ),
      ),
      Effect.fromResult,
    ),
)

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference

const _1: TaggedErrorClass<{
  ErrorName: 'FailedToParseResponseFromRepoPathContentsMetaInfoAPI'
  ExpectedCauseClass: typeof Schema.SchemaError
  DynamicContext: { response: unknown }
}> = buildTaggedErrorClassVerifyingCause<{ response: unknown }>()(
  'FailedToParseResponseFromRepoPathContentsMetaInfoAPI',
  `Failed to parse response from repo path contents meta info API`,
  Schema.SchemaError,
)

export class FailedToParseResponseFromRepoPathContentsMetaInfoAPIError extends _1 {}
