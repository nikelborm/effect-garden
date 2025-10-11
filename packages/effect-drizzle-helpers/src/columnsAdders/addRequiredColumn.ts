import type { NotNull } from 'drizzle-orm'
import {
  addRequiredColumns,
  type ColumnBuilderWithNotNullMethod,
} from './addRequiredColumns.ts'
import type { FunctionExtendingColumnsMap } from './FunctionExtendingColumnsMap.ts'

export const addRequiredColumn = <
  const NameOfColumnInCurrentTable extends string,
  ColumnBuilder extends ColumnBuilderWithNotNullMethod,
>(
  nameOfColumnInCurrentTable: NameOfColumnInCurrentTable,
  buildColumn: () => ColumnBuilder,
): FunctionExtendingColumnsMap<{
  [Key in NameOfColumnInCurrentTable]: NotNull<ColumnBuilder>
}> =>
  addRequiredColumns(
    () => ({ [nameOfColumnInCurrentTable]: buildColumn() }) as any,
  )
