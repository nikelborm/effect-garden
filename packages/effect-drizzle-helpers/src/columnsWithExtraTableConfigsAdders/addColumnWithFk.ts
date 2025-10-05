import type { PgColumnBuilderBase } from 'drizzle-orm/pg-core';
import { flow } from 'effect/Function';
import {
  addColumn,
  type FunctionExtendingColumnsMap,
} from '../columnsAdders/index.ts';
import {
  addFk,
  type ForeignTableColumnGetter,
} from '../extraTableConfigsAdders/index.ts';

export const addColumnWithFk = <
  const NameOfColumnInCurrentTable extends string,
  ColumnBuilder extends PgColumnBuilderBase,
>(
  nameOfColumnInCurrentTable: NameOfColumnInCurrentTable,
  buildColumn: () => ColumnBuilder,
  getColumnOfForeignTable: ForeignTableColumnGetter,
): FunctionExtendingColumnsMap<{
  [Key in NameOfColumnInCurrentTable]: ColumnBuilder;
}> =>
  flow(
    addColumn(nameOfColumnInCurrentTable, buildColumn),
    addFk(nameOfColumnInCurrentTable, getColumnOfForeignTable),
  ) as any;
