import type { AnyPgTable, PgColumnBuilderBase } from 'drizzle-orm/pg-core';
import { addColumnsWithCompositeFk } from './addColumnsWithCompositeFk.ts';
import type {
  FunctionExtendingColumnsMap,
  AllowOnlyNonEmptyObjectsWithActualKeys,
} from '../columnsAdders/index.ts';

export const addColumnsOfTheSameTypeWithCompositeFk = <
  const FkConfig extends [FkConfig] extends [infer U]
    ? AllowOnlyNonEmptyObjectsWithActualKeys<U, keyof NoInfer<TTable>>
    : never,
  TTable extends AnyPgTable,
  ColumnBuilder extends PgColumnBuilderBase,
>(
  getForeignTable: () => TTable,
  buildColumn: () => ColumnBuilder,
  fkConfig: FkConfig,
): FunctionExtendingColumnsMap<
  Record<keyof NoInfer<FkConfig>, ColumnBuilder>
> =>
  addColumnsWithCompositeFk(
    getForeignTable,
    () =>
      Object.fromEntries(
        Object.entries(
          fkConfig as unknown as Record<string, keyof NoInfer<TTable>>,
        ).map(([ownColumnName, foreignColumnName]) => [
          ownColumnName,
          {
            currentColumnBuilder: buildColumn(),
            foreignColumnName,
          },
        ]),
      ) as any,
  );
