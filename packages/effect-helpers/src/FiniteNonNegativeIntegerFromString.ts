import * as Schema from 'effect/Schema'

export const FiniteNonNegativeIntegerFromString = Schema.NumberFromString.pipe(
  Schema.finite(),
  Schema.isGreaterThanOrEqualTo(0),
  Schema.int(),
)

export const FiniteNonNegativeInteger = Schema.Number.pipe(
  Schema.finite(),
  Schema.isGreaterThanOrEqualTo(0),
  Schema.int(),
)
