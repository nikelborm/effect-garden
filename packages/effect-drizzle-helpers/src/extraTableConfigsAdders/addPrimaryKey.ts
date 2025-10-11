import { primaryKey } from 'drizzle-orm/pg-core'
import { addExtraConfig } from './addExtraConfig.ts'
import type { FunctionRequiringColumnsMap } from './FunctionRequiringColumnsMap.ts'
import { getCompressedIdentifierName } from './getCompressedIdentifierName.ts'

export const addPrimaryKey =
  <const TColumnNames extends [string, ...string[]]>(
    ...columnNames: TColumnNames
  ): FunctionRequiringColumnsMap<TColumnNames[number]> =>
  args =>
    addExtraConfig(table => [
      primaryKey({
        name: getCompressedIdentifierName('PK', [args[0]]),
        columns: columnNames.map(name => table[name]) as any,
      }),
    ])(args)
