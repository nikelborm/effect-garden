import * as Schema from 'effect/Schema'

export const AbsentProperty = Schema.optionalWith(Schema.Never, { exact: true })
