import type * as ParseResult from 'effect/ParseResult'
import type * as Result from 'effect/Result'
import * as Schema from 'effect/Schema'

import { ParseError } from '../errors.ts'

export const checkType = <A, I>(
  schemaName: string,
  data: unknown,
  schema: Schema.Schema<A, I>,
): Result.Result<A, ParseError> =>
  Result.mapLeft(
    Schema.decodeUnknownEither(schema)(data),
    (e: ParseResult.ParseError) =>
      new ParseError({ schema: schemaName, data, cause: e }),
  )
