import type { AnyPgTable } from 'drizzle-orm/pg-core';
import {
  type AllowOnlyNonEmptyObjectsWithActualKeys,
  type FunctionExtendingColumnsMap,
  type NonNullInteger,
  nonNullInteger,
} from '../columnsAdders/index.ts';
import { addColumnsOfTheSameTypeWithCompositeFk } from './addColumnsOfTheSameTypeWithCompositeFk.ts';

export const addIntegerRequiredColumnsWithCompositeFk = <
  const FkConfig extends [FkConfig] extends [infer U]
    ? AllowOnlyNonEmptyObjectsWithActualKeys<U, keyof NoInfer<TTable>>
    : never,
  TTable extends AnyPgTable,
>(
  getForeignTable: () => TTable,
  fkConfig: FkConfig,
): FunctionExtendingColumnsMap<
  Record<keyof NoInfer<FkConfig>, NonNullInteger>
> =>
  addColumnsOfTheSameTypeWithCompositeFk(
    getForeignTable,
    nonNullInteger,
    fkConfig,
  );
