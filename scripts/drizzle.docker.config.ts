import { join } from 'node:path'

import { defineConfig } from 'drizzle-kit'

import { decodeDbConfigSync } from './lib/getDevEnvFromFile.ts'
import {
  databasePackageDirPath,
  makeRelativeAgainstProjectRoot,
  migrationsDirPath,
} from './lib/paths.ts'

const env = decodeDbConfigSync(import.meta.env)

// I had to add makeRelativeAgainstProjectRoot because of bug in drizzle-kit:
// https://github.com/drizzle-team/drizzle-orm/issues/3217
export default defineConfig({
  out: makeRelativeAgainstProjectRoot(migrationsDirPath),
  schema: makeRelativeAgainstProjectRoot(
    join(databasePackageDirPath, 'src', 'schema.ts'),
  ),
  dialect: 'postgresql',
  // TODO(drizzle-kit rc): top-level `casing: 'snake_case'` was removed in
  // drizzle-kit 1.0.0-rc. Only `introspect.casing: 'camel' | 'preserve'`
  // remains, so snake_case mapping must now live in the schema definition
  // itself (e.g. pgTable column names) or a future drizzle-kit option.
  dbCredentials: {
    ssl: false,
    password: env.DATABASE_PASSWORD,
    user: env.DATABASE_USERNAME,
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    database: env.DATABASE_NAME,
    // url: 'postgres://usr:pass@localhost:5432/main?sslmode=disable',
  },
})
