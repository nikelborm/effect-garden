#!/usr/bin/env bun

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api'

import { drizzleKitMigrateDev } from './lib/composeCommands.ts'
import { ensureDevScriptRunnerIsReady } from './lib/ensureDevScriptRunnerIsReady.ts'
import { executeSqlInDevPgContainer } from './lib/executeSqlInDevPgContainer.ts'
import { passthroughSpawn } from './lib/passthroughSpawn.ts'
import {
  databasePackageDirPath,
  migrationsDirPath,
  migrationsMetaDirPath,
} from './lib/paths.ts'

const [{ closePsql }] = await Promise.all([
  executeSqlInDevPgContainer(
    dbName =>
      `\\c postgres\nDROP DATABASE IF EXISTS ${dbName}; CREATE DATABASE ${dbName}; \\c ${dbName}\n DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA drizzle CASCADE; CREATE SCHEMA drizzle;`,
  ),
  ensureDevScriptRunnerIsReady(),
])

const closer = closePsql()

await rm(migrationsDirPath, { force: true, recursive: true })

const version = '7' as const
const dialect = 'postgresql' as const
await mkdir(migrationsMetaDirPath, { recursive: true })

const schema = await import(
  join(databasePackageDirPath, 'dist', 'src', 'schema.js')
)

const newSnapshot = generateDrizzleJson(schema, void 0, void 0, 'snake_case')

const sqlQueries = await generateMigration(
  {
    version,
    dialect,
    id: '00000000-0000-0000-0000-000000000000',
    prevId: '',
    tables: {},
    enums: {},
    schemas: {},
    policies: {},
    roles: {},
    sequences: {},
    _meta: {
      schemas: {},
      tables: {},
      columns: {},
    },
  },
  newSnapshot,
)

await Promise.all([
  writeFile(
    join(migrationsMetaDirPath, '_journal.json'),
    JSON.stringify(
      {
        version,
        dialect,
        entries: [
          {
            idx: 0,
            version,
            when: Date.now(),
            tag: '0000_bright_marten_broadcloak',
            breakpoints: true,
          },
        ],
      },
      null,
      2,
    ),
  ),
  writeFile(
    join(migrationsMetaDirPath, '0000_snapshot.json'),
    JSON.stringify(newSnapshot, null, 2),
  ),
  writeFile(
    join(migrationsDirPath, '0000_bright_marten_broadcloak.sql'),
    sqlQueries.map(q => q + '\n--> statement-breakpoint\n').join(''),
  ),
  closer,
])

await passthroughSpawn(...drizzleKitMigrateDev)
console.log()
