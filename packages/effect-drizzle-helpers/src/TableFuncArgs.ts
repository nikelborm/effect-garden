import type { BuildIndexColumn } from 'drizzle-orm'
import type { PgTableExtraConfigValue } from 'drizzle-orm/pg-core'

import type { GeneralColumnMap } from './columnsAdders/index.ts'

export type TableFuncArgs<
  TTableName extends string,
  TColumnsMap extends GeneralColumnMap = GeneralColumnMap,
> = [
  name: TTableName,
  columns: TColumnsMap,
  extraConfig: (
    table: RemapToTableArgumentOfExtraConfigRenderer<TColumnsMap>,
  ) => PgTableExtraConfigValue[],
]

export type RemapToTableArgumentOfExtraConfigRenderer<
  TColumnsMap extends GeneralColumnMap = GeneralColumnMap,
> = {
  [Key in keyof TColumnsMap]: BuildIndexColumn<'pg'>
}
