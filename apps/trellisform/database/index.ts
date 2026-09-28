import { makeWithDefaults } from 'drizzle-orm/effect-postgres'

import * as Context from 'effect/Context'

import { relationalSchema } from './src/relations.ts'
import * as Schema from './src/schema.ts'

export const schema = Schema
export type schema = typeof schema

export { relationalSchema }

export const schemaWithRelations = {
  ...schema,
  relations: relationalSchema,
}
export type schemaWithRelations = typeof schemaWithRelations

export class DrizzleDB extends Context.Service<DrizzleDB>()('DrizzleDB', {
  make: makeWithDefaults({
    relations: relationalSchema,
  }),
}) {}
