import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'

export const RecordFromEntries = <A, E, R>(schema: Schema.Schema<A, E, R>) =>
  Schema.transform(
    Schema.Array(Schema.Tuple(Schema.String, schema)),
    Schema.Record({ key: Schema.String, value: schema }),
    {
      decode: (_, fromI) => Record.fromEntries(fromI),
      encode: (_, toA) => Record.toEntries(toA),
      strict: true,
    },
  )

export const RecordToEntries = <A, E, R>(schema: Schema.Schema<A, E, R>) =>
  Schema.transform(
    Schema.Record({ key: Schema.String, value: schema }),
    Schema.Array(Schema.Tuple(Schema.String, schema)),
    {
      encode: (_, fromI) => Record.fromEntries(fromI),
      decode: (_, toA) => Record.toEntries(toA),
      strict: true,
    },
  )
