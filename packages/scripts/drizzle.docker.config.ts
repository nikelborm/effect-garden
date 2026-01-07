import { join } from 'path'

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
  casing: 'snake_case',
  dbCredentials: {
    ssl: false,
    password: env['DATABASE_PASSWORD'],
    user: env['DATABASE_USERNAME'],
    host: env['DATABASE_HOST'],
    port: env['DATABASE_PORT'],
    database: env['DATABASE_NAME'],
    // url: 'postgres://usr:pass@localhost:5432/main?sslmode=disable',
  },
})
