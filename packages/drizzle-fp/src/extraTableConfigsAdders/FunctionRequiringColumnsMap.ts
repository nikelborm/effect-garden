import type { ColumnMap } from '../columnsAdders/index.ts'
import type { TableFuncArgs } from '../TableFuncArgs.ts'

export type FunctionRequiringColumnsMap<
  TRequiredPresenceOfColumnNames extends string,
> = <
  const TTableName extends string,
  TColumnsMap extends ColumnMap<TRequiredPresenceOfColumnNames> &
    ColumnMap<string>,
>([snakeCaseTableName, options, extraConfig]: TableFuncArgs<
  TTableName,
  TColumnsMap
>) => TableFuncArgs<TTableName, TColumnsMap>
