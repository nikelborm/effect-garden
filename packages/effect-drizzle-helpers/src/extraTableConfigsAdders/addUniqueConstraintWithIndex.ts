import { strSnakeCase } from '@nevware21/ts-utils';
import { unique } from 'drizzle-orm/pg-core';
import { addExtraConfig } from './addExtraConfig.ts';
import type { FunctionRequiringColumnsMap } from './FunctionRequiringColumnsMap.ts';
import { getCompressedIdentifierName } from './getCompressedIdentifierName.ts';

export const addUniqueConstraintWithIndex =
  <const TColumnNames extends [string, ...string[]]>(
    ...columnNames: TColumnNames
  ): FunctionRequiringColumnsMap<TColumnNames[number]> =>
  args =>
    addExtraConfig(table => [
      unique(
        getCompressedIdentifierName('UQ', [
          args[0],
          ...columnNames.map(name => strSnakeCase(table[name]?.name || name)),
        ]),
      ).on(...(columnNames.map(columnName => table[columnName]) as [any])),
    ])(args);
