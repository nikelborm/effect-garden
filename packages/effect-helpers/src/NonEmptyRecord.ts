import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'

export const NonEmptyRecordFilter = Schema.makeFilter(
  (record: Record.ReadonlyRecord<string, unknown>) =>
    Record.size(record) > 0 || 'Record must contain at least some keys',
)

export const NonEmptyRecord = <
  K extends Schema.Record.Key,
  V extends Schema.Constraint,
>(
  key: K,
  value: V,
) => Schema.Record(key, value).check(NonEmptyRecordFilter)
