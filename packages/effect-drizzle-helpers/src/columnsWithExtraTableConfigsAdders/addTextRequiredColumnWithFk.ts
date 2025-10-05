import {
  type FunctionExtendingColumnsMap,
  type NonNullText,
  nonNullText,
} from '../columnsAdders/index.ts';
import type { ForeignTableColumnGetter } from '../extraTableConfigsAdders/index.ts';
import { addColumnWithFk } from './addColumnWithFk.ts';

export const addTextRequiredColumnWithFk = <
  const NameOfColumnInCurrentTable extends string,
>(
  nameOfColumnInCurrentTable: NameOfColumnInCurrentTable,
  getColumnOfForeignTable: ForeignTableColumnGetter,
): FunctionExtendingColumnsMap<
  Record<NameOfColumnInCurrentTable, NonNullText>
> =>
  addColumnWithFk(
    nameOfColumnInCurrentTable,
    nonNullText,
    getColumnOfForeignTable,
  );
