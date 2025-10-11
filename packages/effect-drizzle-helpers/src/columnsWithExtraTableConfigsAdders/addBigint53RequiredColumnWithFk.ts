import {
  type FunctionExtendingColumnsMap,
  type NonNullBigint53,
  nonNullBigint53,
} from '../columnsAdders/index.ts'
import type { ForeignTableColumnGetter } from '../extraTableConfigsAdders/index.ts'
import { addColumnWithFk } from './addColumnWithFk.ts'

export const addBigint53RequiredColumnWithFk = <
  const NameOfColumnInCurrentTable extends string,
>(
  nameOfColumnInCurrentTable: NameOfColumnInCurrentTable,
  getColumnOfForeignTable: ForeignTableColumnGetter,
): FunctionExtendingColumnsMap<
  Record<NameOfColumnInCurrentTable, NonNullBigint53>
> =>
  addColumnWithFk(
    nameOfColumnInCurrentTable,
    nonNullBigint53,
    getColumnOfForeignTable,
  )
