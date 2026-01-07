import { strSnakeCase } from '@nevware21/ts-utils'
import type { AnyPgTable } from 'drizzle-orm/pg-core'
import { foreignKey } from 'drizzle-orm/pg-core'

import { addExtraConfig } from './addExtraConfig.ts'
import type { FunctionRequiringColumnsMap } from './FunctionRequiringColumnsMap.ts'
import { getCompressedIdentifierName } from './getCompressedIdentifierName.ts'

export const addCompositeFk =
  <
    const TRequiredPresenceOfColumnNames extends string,
    TTable extends AnyPgTable,
  >(
    getForeignTable: () => TTable,
    fkConfig: Record<TRequiredPresenceOfColumnNames, keyof NoInfer<TTable>>,
  ): FunctionRequiringColumnsMap<TRequiredPresenceOfColumnNames> =>
  args =>
    addExtraConfig(table => {
      const currentTableName = args[0]
      const ownColumnNamesInitial = Object.keys(fkConfig)
      const ownColumnNamesSnakeCasedCloseToSQL = ownColumnNamesInitial.map(
        name => strSnakeCase(table[name]?.name || name),
      )

      const foreignTable = getForeignTable() as any
      const foreignTableName = foreignTable[Symbol.for('drizzle:Name')]

      const foreignColumnNames = Object.values(fkConfig) as [any]
      const foreignColumnNamesSnakeCasedCloseToSQL = foreignColumnNames.map(
        name => strSnakeCase(foreignTable[name].name || name),
      )

      return [
        foreignKey({
          name: getCompressedIdentifierName('FK', [
            currentTableName,
            ...ownColumnNamesSnakeCasedCloseToSQL,
            foreignTableName,
            ...foreignColumnNamesSnakeCasedCloseToSQL,
          ]),
          columns: ownColumnNamesInitial.map(name => table[name]) as [any],
          foreignColumns: foreignColumnNames.map(
            name => foreignTable[name],
          ) as [any],
        }),
      ]
    })(args)
