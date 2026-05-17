import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'

export const NonEmptyRecord = <
  K extends Schema.Schema.All,
  V extends Schema.Schema.All,
>(
  key: K,
  value: V,
) =>
  Schema.Record({ key, value }).pipe(
    Schema.filter(
      record =>
        !!Record.size(record) || 'Record must contain at least some keys',
    ),
  )
