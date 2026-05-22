import { strSnakeCase } from '@nevware21/ts-utils'
import type { Table } from 'drizzle-orm'
import { getColumnTable, getTableName } from 'drizzle-orm'
import { foreignKey } from 'drizzle-orm/pg-core'

import { addExtraConfig } from './addExtraConfig.ts'
import type { ForeignTableColumnGetter } from './ForeignTableColumnGetter.ts'
import type { FunctionRequiringColumnsMap } from './FunctionRequiringColumnsMap.ts'
import { getCompressedIdentifierName } from './getCompressedIdentifierName.ts'

export const addFk =
  <const NameOfColumnInCurrentTable extends string>(
    ownInitialColumnName: NameOfColumnInCurrentTable,
    getColumnOfForeignTable: ForeignTableColumnGetter,
  ): FunctionRequiringColumnsMap<NameOfColumnInCurrentTable> =>
  args =>
    addExtraConfig(table => {
      const currentTableName = args[0]
      const ownColumnNameSnakeCasedCloseToSQL = strSnakeCase(
        table[ownInitialColumnName].name || ownInitialColumnName,
      )

      const foreignColumn = getColumnOfForeignTable()
      const foreignTableName = getTableName(
        getColumnTable<Table>(foreignColumn),
      )
      const foreignColumnNamesSnakeCasedCloseToSQL = foreignColumn.name

      const isForeignColumnNameAPrimitiveId =
        `${foreignTableName}_id` === foreignColumnNamesSnakeCasedCloseToSQL

      const doOwnAndForeignColumnNamesMatch =
        ownColumnNameSnakeCasedCloseToSQL ===
        foreignColumnNamesSnakeCasedCloseToSQL

      return [
        foreignKey({
          name: getCompressedIdentifierName('FK', [
            currentTableName,
            ownColumnNameSnakeCasedCloseToSQL,
            ...(isForeignColumnNameAPrimitiveId &&
            doOwnAndForeignColumnNamesMatch
              ? []
              : isForeignColumnNameAPrimitiveId ||
                  doOwnAndForeignColumnNamesMatch
                ? [foreignTableName]
                : [foreignTableName, foreignColumnNamesSnakeCasedCloseToSQL]),
          ]),
          columns: [table[ownInitialColumnName]],
          foreignColumns: [foreignColumn],
        }),
      ]
    })(args)
