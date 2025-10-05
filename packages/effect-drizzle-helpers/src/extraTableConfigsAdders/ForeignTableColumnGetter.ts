import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export type ForeignTableColumnGetter = () => AnyPgColumn<{ tableName: string }>;
