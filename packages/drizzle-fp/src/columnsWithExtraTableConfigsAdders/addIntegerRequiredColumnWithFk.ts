import {
  type FunctionExtendingColumnsMap,
  type NonNullInteger,
  nonNullInteger,
} from '../columnsAdders/index.ts'
import type { ForeignTableColumnGetter } from '../extraTableConfigsAdders/index.ts'
import { addColumnWithFk } from './addColumnWithFk.ts'

export const addIntegerRequiredColumnWithFk = <
  const NameOfColumnInCurrentTable extends string,
>(
  nameOfColumnInCurrentTable: NameOfColumnInCurrentTable,
  getColumnOfForeignTable: ForeignTableColumnGetter,
): FunctionExtendingColumnsMap<
  Record<NameOfColumnInCurrentTable, NonNullInteger>
> =>
  addColumnWithFk(
    nameOfColumnInCurrentTable,
    nonNullInteger,
    getColumnOfForeignTable,
  )
