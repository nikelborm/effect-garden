import type { IsIdentity, NotNull } from 'drizzle-orm'
import type { PgBigInt53BuilderInitial } from 'drizzle-orm/pg-core'
import { bigint } from 'drizzle-orm/pg-core'

import { pipe } from 'effect/Function'

import { addColumn, type GeneralColumnMap } from '../columnsAdders/index.ts'
import { addPrimaryKey } from '../extraTableConfigsAdders/index.ts'
import type { TableFuncArgs } from '../TableFuncArgs.ts'

export const addBigint53IdColumnAsPrimaryKey = <
  const TTableName extends string,
  TColumnsMap extends GeneralColumnMap,
>(
  args: TableFuncArgs<TTableName, TColumnsMap>,
): TableFuncArgs<
  TTableName,
  TColumnsMap & { id: PgBigint53GeneratedAlwaysAsIdentity<TTableName> }
> =>
  pipe(
    addColumn('id', () =>
      bigint(`${args[0]}_id`, {
        mode: 'number',
      }).generatedAlwaysAsIdentity(),
    )(args),
    addPrimaryKey('id'),
  )

type PgBigint53GeneratedAlwaysAsIdentity<TTableName extends string> =
  IsIdentity<NotNull<PgBigInt53BuilderInitial<`${TTableName}_id`>>, 'always'>
