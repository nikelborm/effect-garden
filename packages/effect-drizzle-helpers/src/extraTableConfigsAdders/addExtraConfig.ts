import type { PgTableExtraConfigValue } from 'drizzle-orm/pg-core'
import type { ColumnMap, GeneralColumnMap } from '../columnsAdders/index.ts'
import type { RemapToTableArgumentOfExtraConfigRenderer } from '../TableFuncArgs.ts'
import type { FunctionRequiringColumnsMap } from './FunctionRequiringColumnsMap.ts'

export const addExtraConfig =
  <TRequiredPresenceOfColumnNames extends string = never>(
    additionalExtraConfig: <
      TColumnsMap extends GeneralColumnMap = GeneralColumnMap,
    >(
      table: RemapToTableArgumentOfExtraConfigRenderer<
        TColumnsMap & ColumnMap<NoInfer<TRequiredPresenceOfColumnNames>>
      >,
    ) => PgTableExtraConfigValue[],
  ): FunctionRequiringColumnsMap<TRequiredPresenceOfColumnNames> =>
  ([snakeCaseTableName, options, extraConfig]) => [
    snakeCaseTableName,
    options,
    table => [...extraConfig(table), ...additionalExtraConfig(table)],
  ]
