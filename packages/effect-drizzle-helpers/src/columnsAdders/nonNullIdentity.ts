import { bigint, integer, text, uuid } from 'drizzle-orm/pg-core'

export const nonNullInteger = () => integer().notNull()
export const nonNullBigint53 = () => bigint({ mode: 'number' }).notNull()
export const nonNullUuid = () => uuid().notNull()
export const nonNullText = () => text().notNull()

export type NonNullInteger = ReturnType<typeof nonNullInteger>
export type NonNullBigint53 = ReturnType<typeof nonNullBigint53>
export type NonNullUUID = ReturnType<typeof nonNullUuid>
export type NonNullText = ReturnType<typeof nonNullText>
