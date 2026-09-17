import * as Schema from 'effect/Schema'

export const FiniteNonNegativeIntegerFromString =
  Schema.FiniteFromString.check(
    Schema.isInt(),
    Schema.isGreaterThanOrEqualTo(0),
  )

export const FiniteNonNegativeInteger = Schema.Finite.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(0),
)
