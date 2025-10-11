import type { AnyPgTable } from 'drizzle-orm/pg-core'
import {
  type AllowOnlyNonEmptyObjectsWithActualKeys,
  type FunctionExtendingColumnsMap,
  type NonNullBigint53,
  nonNullBigint53,
} from '../columnsAdders/index.ts'
import { addColumnsOfTheSameTypeWithCompositeFk } from './addColumnsOfTheSameTypeWithCompositeFk.ts'

export const addBigint53RequiredColumnsWithCompositeFk = <
  const FkConfig extends [FkConfig] extends [infer U]
    ? AllowOnlyNonEmptyObjectsWithActualKeys<U, keyof NoInfer<TTable>>
    : never,
  TTable extends AnyPgTable,
>(
  getForeignTable: () => TTable,
  fkConfig: FkConfig,
): FunctionExtendingColumnsMap<
  Record<keyof NoInfer<FkConfig>, NonNullBigint53>
> =>
  addColumnsOfTheSameTypeWithCompositeFk(
    getForeignTable,
    nonNullBigint53,
    fkConfig,
  )
