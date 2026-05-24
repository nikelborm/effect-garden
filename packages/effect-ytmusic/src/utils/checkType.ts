import * as Either from 'effect/Either'
import type * as ParseResult from 'effect/ParseResult'
import * as Schema from 'effect/Schema'

import { ParseError } from '../errors.ts'

export const checkType = <A, I>(
  schemaName: string,
  data: unknown,
  schema: Schema.Schema<A, I>,
): Either.Either<A, ParseError> =>
  Either.mapLeft(
    Schema.decodeUnknownEither(schema)(data),
    (e: ParseResult.ParseError) =>
      new ParseError({ schema: schemaName, data, cause: e }),
  )
