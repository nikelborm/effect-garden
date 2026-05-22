import type { AnyPgTable } from 'drizzle-orm/pg-core'

import {
  type FunctionExtendingColumnsMap,
  type NonNullInteger,
  nonNullInteger,
} from '../columnsAdders/index.ts'
import { addColumnsOfTheSameTypeWithCompositeFk1to1 } from './addColumnsOfTheSameTypeWithCompositeFk1to1.ts'

export const addIntegerRequiredColumnsWithCompositeFk1to1 = <
  const FkConfig extends readonly [
    keyof TTable,
    keyof TTable,
    ...(keyof TTable)[],
  ],
  TTable extends AnyPgTable,
>(
  getForeignTable: () => TTable,
  fkConfig: FkConfig,
): FunctionExtendingColumnsMap<Record<FkConfig[number], NonNullInteger>> =>
  addColumnsOfTheSameTypeWithCompositeFk1to1(
    getForeignTable,
    nonNullInteger,
    fkConfig,
  )
