import * as Schema from 'effect/Schema'

export const OptionalProperty = Schema.optionalWith({ exact: true }) as <
  S extends Schema.Schema.All,
>(
  self: S,
) => Schema.optionalWith<S, { exact: true }>
