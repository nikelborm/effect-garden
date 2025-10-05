import type { AnyPgTable, PgColumnBuilderBase } from 'drizzle-orm/pg-core';
import type { FunctionExtendingColumnsMap } from '../columnsAdders/index.ts';
import { addColumnsOfTheSameTypeWithCompositeFk } from './addColumnsOfTheSameTypeWithCompositeFk.ts';

export const addColumnsOfTheSameTypeWithCompositeFk1to1 = <
  const FkConfig extends readonly [
    keyof TTable,
    keyof TTable,
    ...(keyof TTable)[],
  ],
  TTable extends AnyPgTable,
  ColumnBuilder extends PgColumnBuilderBase,
>(
  getForeignTable: () => TTable,
  buildColumn: () => ColumnBuilder,
  fkConfig: FkConfig,
): FunctionExtendingColumnsMap<Record<FkConfig[number], ColumnBuilder>> =>
  addColumnsOfTheSameTypeWithCompositeFk(
    getForeignTable,
    buildColumn,
    Object.fromEntries(fkConfig.map(column => [column, column])) as any,
  );
