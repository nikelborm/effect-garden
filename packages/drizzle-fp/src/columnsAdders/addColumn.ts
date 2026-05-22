import type { AnyPgColumnBuilder } from 'drizzle-orm/pg-core'

import { addColumns } from './addColumns.ts'
import type { FunctionExtendingColumnsMap } from './FunctionExtendingColumnsMap.ts'

export const addColumn = <
  const NameOfColumnInCurrentTable extends string,
  ColumnBuilder extends AnyPgColumnBuilder,
>(
  nameOfColumnInCurrentTable: NameOfColumnInCurrentTable,
  buildColumn: () => ColumnBuilder,
): FunctionExtendingColumnsMap<{
  [Key in NameOfColumnInCurrentTable]: ColumnBuilder
}> => addColumns(() => ({ [nameOfColumnInCurrentTable]: buildColumn() }) as any)
