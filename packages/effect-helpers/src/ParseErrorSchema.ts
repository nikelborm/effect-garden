import * as ParseResult from 'effect/ParseResult'
import * as Schema from 'effect/Schema'

export const ParseErrorSchema = Schema.declare(
  (a): a is ParseResult.ParseError => ParseResult.isParseError(a),
)
