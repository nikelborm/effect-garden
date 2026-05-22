import type { AllowOnlyValidColumnMaps } from './AllowOnlyValidColumnMaps.ts'
import type { FunctionExtendingColumnsMap } from './FunctionExtendingColumnsMap.ts'

export const addColumns = <
  TAdditionalColumnsMap extends [TAdditionalColumnsMap] extends [infer U]
    ? AllowOnlyValidColumnMaps<U>
    : never,
>(
  getAdditionalColumnMap: () => TAdditionalColumnsMap,
): FunctionExtendingColumnsMap<TAdditionalColumnsMap> =>
  (([snakeCaseTableName, options, extraConfig]) => [
    snakeCaseTableName,
    {
      ...options,
      ...(getAdditionalColumnMap() as any),
    },
    table => extraConfig(table),
  ]) as FunctionExtendingColumnsMap<TAdditionalColumnsMap>
