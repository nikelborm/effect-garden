import type { TableFuncArgs } from './TableFuncArgs.ts';

export const initPgTable = <const TTableName extends string>(
  snakeCaseTableName: TTableName,
): TableFuncArgs<TTableName, {}> => [snakeCaseTableName, {}, () => []];
