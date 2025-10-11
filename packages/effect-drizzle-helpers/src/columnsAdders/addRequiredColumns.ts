import type { NotNull } from 'drizzle-orm'
import type { PgColumnBuilderBase } from 'drizzle-orm/pg-core'
import type { AllowOnlyNonEmptyObjectsWithActualKeys } from './AllowOnlyValidColumnMaps.ts'
import { addColumns } from './addColumns.ts'
import type { FunctionExtendingColumnsMap } from './FunctionExtendingColumnsMap.ts'

export const addRequiredColumns = <
  const TAdditionalColumnsMap extends [TAdditionalColumnsMap] extends [infer U]
    ? AllowOnlyNonEmptyObjectsWithActualKeys<U, ColumnBuilderWithNotNullMethod>
    : never,
>(
  getAdditionalColumnMap: () => TAdditionalColumnsMap,
): BuiltRequiredColumnsAdder<TAdditionalColumnsMap> =>
  addColumns(
    () =>
      Object.fromEntries(
        Object.entries(
          getAdditionalColumnMap() as unknown as Record<
            string,
            ColumnBuilderWithNotNullMethod
          >,
        ).map(([ownColumnName, currentColumnBuilder]) => [
          ownColumnName,
          currentColumnBuilder.notNull(),
        ]),
      ) as any,
  )

type BuiltRequiredColumnsAdder<TAdditionalColumnsMap> =
  FunctionExtendingColumnsMap<MakeColumnsInMapNotNull<TAdditionalColumnsMap>>

type MakeColumnsInMapNotNull<TColumnsMap> = {
  [ColumnName in keyof TColumnsMap]: TColumnsMap[ColumnName] extends PgColumnBuilderBase
    ? NotNull<TColumnsMap[ColumnName]>
    : never
}

export type ColumnBuilderWithNotNullMethod = PgColumnBuilderBase & {
  notNull: () => NotNull<PgColumnBuilderBase>
}
