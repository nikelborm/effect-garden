import {
  type FunctionExtendingColumnsMap,
  type NonNullUUID,
  nonNullUuid,
} from '../columnsAdders/index.ts'
import type { ForeignTableColumnGetter } from '../extraTableConfigsAdders/index.ts'
import { addColumnWithFk } from './addColumnWithFk.ts'

export const addUuidRequiredColumnWithFk = <
  const NameOfColumnInCurrentTable extends string,
>(
  nameOfColumnInCurrentTable: NameOfColumnInCurrentTable,
  getColumnOfForeignTable: ForeignTableColumnGetter,
): FunctionExtendingColumnsMap<
  Record<NameOfColumnInCurrentTable, NonNullUUID>
> =>
  addColumnWithFk(
    nameOfColumnInCurrentTable,
    nonNullUuid,
    getColumnOfForeignTable,
  )
