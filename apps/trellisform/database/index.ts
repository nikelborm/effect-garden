import type { PgRemoteDatabase } from 'drizzle-orm/pg-proxy'

import type * as SqlClient from '@effect/sql/SqlClient'
import { make } from '@effect/sql-drizzle/Pg'
import * as Effect from 'effect/Effect'

import * as Relations from './src/relations.ts'
import * as Schema from './src/schema.ts'

export const schema = Schema
export type schema = typeof schema

export const relations = Relations
export type relations = typeof relations

export type schemaWithRelations = schema & relations

export const schemaWithRelations: schemaWithRelations = {
  ...schema,
  ...relations,
}

export class DrizzleDB extends Effect.Service<DrizzleDB>()('DrizzleDB', {
  effect: make({
    schema: schemaWithRelations,
    casing: 'snake_case',
  }) as Effect.Effect<
    PgRemoteDatabase<schemaWithRelations>,
    never,
    SqlClient.SqlClient
  >, // TODO: is this assertion actually needed?
}) {}
