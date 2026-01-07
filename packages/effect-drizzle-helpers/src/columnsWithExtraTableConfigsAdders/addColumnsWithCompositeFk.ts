import type { AnyPgTable, PgColumnBuilderBase } from 'drizzle-orm/pg-core'

import { flow } from 'effect/Function'

import {
  type AllowOnlyNonEmptyObjectsWithActualKeys,
  addColumns,
  type FunctionExtendingColumnsMap,
} from '../columnsAdders/index.ts'
import { addCompositeFk } from '../extraTableConfigsAdders/addCompositeFk.ts'

export const addColumnsWithCompositeFk = <
  const FkConfig extends [FkConfig] extends [infer U]
    ? AllowOnlyNonEmptyObjectsWithActualKeys<
        U,
        BatchColumnAdderValueOfRecord<TTable>
      >
    : never,
  TTable extends AnyPgTable,
>(
  getForeignTable: () => TTable,
  fkConfig: () => FkConfig,
): FunctionExtendingColumnsMap<{
  [ColumnName in keyof FkConfig]: FkConfig[ColumnName] extends {
    currentColumnBuilder: infer U
  }
    ? U
    : never
}> => {
  type Entry = [string, BatchColumnAdderValueOfRecord<TTable>]

  const compositeFkConfig = Object.fromEntries(
    (Object.entries(fkConfig()) as unknown as Entry[]).map(
      ([ownColumnName, { foreignColumnName }]) => [
        ownColumnName,
        foreignColumnName,
      ],
    ),
  )

  return flow(
    addColumns(
      () =>
        Object.fromEntries(
          (Object.entries(fkConfig()) as unknown as Entry[]).map(
            ([ownColumnName, { currentColumnBuilder }]) => [
              ownColumnName,
              currentColumnBuilder,
            ],
          ),
        ) as any,
    ),
    addCompositeFk(getForeignTable, compositeFkConfig),
  ) as any
}

type BatchColumnAdderValueOfRecord<TTable> = {
  currentColumnBuilder: PgColumnBuilderBase
  foreignColumnName: keyof NoInfer<TTable>
}
