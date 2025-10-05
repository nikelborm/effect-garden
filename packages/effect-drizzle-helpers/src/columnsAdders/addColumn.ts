import type { PgColumnBuilderBase } from 'drizzle-orm/pg-core';
import type { FunctionExtendingColumnsMap } from './FunctionExtendingColumnsMap.ts';
import { addColumns } from './addColumns.ts';

export const addColumn = <
  const NameOfColumnInCurrentTable extends string,
  ColumnBuilder extends PgColumnBuilderBase,
>(
  nameOfColumnInCurrentTable: NameOfColumnInCurrentTable,
  buildColumn: () => ColumnBuilder,
): FunctionExtendingColumnsMap<{
  [Key in NameOfColumnInCurrentTable]: ColumnBuilder;
}> =>
  addColumns(() => ({ [nameOfColumnInCurrentTable]: buildColumn() } as any));
