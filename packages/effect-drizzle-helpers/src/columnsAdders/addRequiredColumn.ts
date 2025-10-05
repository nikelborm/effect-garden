import type { NotNull } from 'drizzle-orm';
import type { FunctionExtendingColumnsMap } from './FunctionExtendingColumnsMap.ts';
import {
  addRequiredColumns,
  type ColumnBuilderWithNotNullMethod,
} from './addRequiredColumns.ts';

export const addRequiredColumn = <
  const NameOfColumnInCurrentTable extends string,
  ColumnBuilder extends ColumnBuilderWithNotNullMethod,
>(
  nameOfColumnInCurrentTable: NameOfColumnInCurrentTable,
  buildColumn: () => ColumnBuilder,
): FunctionExtendingColumnsMap<{
  [Key in NameOfColumnInCurrentTable]: NotNull<ColumnBuilder>;
}> =>
  addRequiredColumns(
    () => ({ [nameOfColumnInCurrentTable]: buildColumn() } as any),
  );
