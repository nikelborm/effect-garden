import type { IsIdentity, NotNull } from 'drizzle-orm';
import { integer, type PgIntegerBuilderInitial } from 'drizzle-orm/pg-core';
import { pipe } from 'effect/Function';
import { addColumns, type GeneralColumnMap } from '../columnsAdders/index.ts';
import { addPrimaryKey } from '../extraTableConfigsAdders/index.ts';
import type { TableFuncArgs } from '../TableFuncArgs.ts';

export const addIntegerIdColumnAsPrimaryKey = <
  const TTableName extends string,
  TColumnsMap extends GeneralColumnMap,
>(
  args: TableFuncArgs<TTableName, TColumnsMap>,
): TableFuncArgs<
  TTableName,
  TColumnsMap & { id: PgIntegerGeneratedAlwaysAsIdentity<TTableName> }
> =>
  pipe(
    addColumns(() => ({
      id: integer(`${args[0]}_id`).generatedAlwaysAsIdentity(),
    }))(args),
    addPrimaryKey('id'),
  );

export type PgIntegerGeneratedAlwaysAsIdentity<TTableName extends string> =
  IsIdentity<NotNull<PgIntegerBuilderInitial<`${TTableName}_id`>>, 'always'>;
