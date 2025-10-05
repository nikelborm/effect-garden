import { strCamelCase } from '@nevware21/ts-utils';
import { pgTable } from 'drizzle-orm/pg-core';
import type { CamelCase } from 'type-fest';
import type { GeneralColumnMap } from './columnsAdders/AllowOnlyValidColumnMaps.ts';
import type { TableFuncArgs } from './TableFuncArgs.ts';

export const finalizePgTable = <
  const TTableName extends string,
  TColumnsMap extends GeneralColumnMap = GeneralColumnMap,
>(
  args: TableFuncArgs<TTableName, TColumnsMap>,
) => {
  const table = pgTable(...args);

  const exportName = strCamelCase(args[0]);
  type ExportName = CamelCase<TTableName>;

  return { [exportName]: table } as {
    [key in ExportName]: typeof table;
  };
};
