import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { ParseError } from '../errors.ts'

export const checkType = <A>(
  schemaName: string,
  data: unknown,
  schema: Schema.Decoder<A>,
): Effect.Effect<A, ParseError> =>
  Effect.mapError(
    Effect.fromResult(Schema.decodeUnknownResult(schema)(data)),
    cause => new ParseError({ schema: schemaName, data, cause }),
  )
