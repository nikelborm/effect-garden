import type { NotNull } from 'drizzle-orm'
import { type PgUUIDBuilderInitial, uuid } from 'drizzle-orm/pg-core'

import { pipe } from 'effect/Function'

import { addColumns, type GeneralColumnMap } from '../columnsAdders/index.ts'
import { addPrimaryKey } from '../extraTableConfigsAdders/index.ts'
import type { TableFuncArgs } from '../TableFuncArgs.ts'

export const addUuidColumnAsPrimaryKey = <
  const TTableName extends string,
  TColumnsMap extends GeneralColumnMap,
>(
  args: TableFuncArgs<TTableName, TColumnsMap>,
): TableFuncArgs<TTableName, TColumnsMap & { id: PgUUID<TTableName> }> =>
  pipe(
    addColumns(() => ({
      id: uuid(`${args[0]}_uuid`).notNull(),
    }))(args),
    addPrimaryKey('id'),
  )

export type PgUUID<TTableName extends string> = NotNull<
  PgUUIDBuilderInitial<`${TTableName}_uuid`>
>
