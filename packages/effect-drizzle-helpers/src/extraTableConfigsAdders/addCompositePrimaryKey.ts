import { addPrimaryKey } from './addPrimaryKey.ts';
import type { FunctionRequiringColumnsMap } from './FunctionRequiringColumnsMap.ts';

export const addCompositePrimaryKey = <
  const TColumnNames extends [string, string, ...string[]],
>(
  ...columnNames: TColumnNames
): FunctionRequiringColumnsMap<TColumnNames[number]> =>
  addPrimaryKey(...columnNames);
