import type { AnyPgTable } from 'drizzle-orm/pg-core'

import {
  type FunctionExtendingColumnsMap,
  type NonNullBigint53,
  nonNullBigint53,
} from '../columnsAdders/index.ts'
import { addColumnsOfTheSameTypeWithCompositeFk1to1 } from './addColumnsOfTheSameTypeWithCompositeFk1to1.ts'

export const addBigint53RequiredColumnsWithCompositeFk1to1 = <
  const FkConfig extends readonly [
    keyof TTable,
    keyof TTable,
    ...(keyof TTable)[],
  ],
  TTable extends AnyPgTable,
>(
  getForeignTable: () => TTable,
  fkConfig: FkConfig,
): FunctionExtendingColumnsMap<Record<FkConfig[number], NonNullBigint53>> =>
  addColumnsOfTheSameTypeWithCompositeFk1to1(
    getForeignTable,
    nonNullBigint53,
    fkConfig,
  )
