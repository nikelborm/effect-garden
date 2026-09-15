import { make } from 'drizzle-orm/effect-postgres'

import * as Context from 'effect/Context'

import { relationalSchema } from './src/relations.ts'
import * as Schema from './src/schema.ts'

export const schema = Schema
export type schema = typeof schema

export { relationalSchema }

export class DrizzleDB extends Context.Service<DrizzleDB>()('DrizzleDB', {
  make: make({
    schema,
    relations: relationalSchema,
    casing: 'snake_case',
  }),
}) {}
