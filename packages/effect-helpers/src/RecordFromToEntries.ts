import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'
import * as SchemaGetter from 'effect/SchemaGetter'

// TODO: heavily test
export const RecordFromEntries = <TRecordValueSchema extends Schema.Constraint>(
  recordValueSchema: TRecordValueSchema,
) =>
  Schema.Array(Schema.Tuple([Schema.String, recordValueSchema])).pipe(
    Schema.decodeTo(Schema.Record(Schema.String, recordValueSchema), {
      decode: SchemaGetter.transform(
        (entries: ReadonlyArray<readonly [string, any]>) =>
          Record.fromEntries(entries),
      ),
      encode: SchemaGetter.transform(
        (record: Record.ReadonlyRecord<string, any>) =>
          Record.toEntries(record as any),
      ),
    } as any),
  )

export const RecordToEntries = <TRecordValueSchema extends Schema.Constraint>(
  recordValueSchema: TRecordValueSchema,
) =>
  Schema.Record(Schema.String, recordValueSchema).pipe(
    Schema.decodeTo(
      Schema.Array(Schema.Tuple([Schema.String, recordValueSchema])),
      {
        decode: SchemaGetter.transform(
          (record: Record.ReadonlyRecord<string, any>) =>
            Record.toEntries(record),
        ),
        encode: SchemaGetter.transform(
          (entries: ReadonlyArray<readonly [string, any]>) =>
            Record.fromEntries(entries),
        ),
      } as any,
    ),
  )
