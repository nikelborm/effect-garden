import { make } from 'drizzle-orm/effect-postgres'

import * as Effect from 'effect/Effect'

import { relationalSchema } from './src/relations.ts'
import * as Schema from './src/schema.ts'

export const schema = Schema
export type schema = typeof schema

export { relationalSchema }

export class DrizzleDB extends Effect.Service<DrizzleDB>()('DrizzleDB', {
  effect: make({
    schema,
    relations: relationalSchema,
    casing: 'snake_case',
  }),
}) {}
