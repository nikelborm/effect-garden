#!/usr/bin/env bun

import { join } from 'node:path'

import {
  generateDrizzleJson,
  generateMigration,
} from 'drizzle-kit/api-postgres'

import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import * as Cause from 'effect/Cause'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as FileSystem from 'effect/FileSystem'

import { drizzleKitMigrateDev } from './lib/composeCommands.ts'
import { ensureDevScriptRunnerIsReady } from './lib/ensureDevScriptRunnerIsReady.ts'
import { executeSqlInDevPgContainer } from './lib/executeSqlInDevPgContainer.ts'
import { passthroughSpawn } from './lib/passthroughSpawn.ts'
import {
  databasePackageDirPath,
  migrationsDirPath,
  migrationsMetaDirPath,
} from './lib/paths.ts'

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem

  const [{ closePsql }] = yield* Effect.all(
    [
      executeSqlInDevPgContainer(
        dbName =>
          `\\c postgres\nDROP DATABASE IF EXISTS ${dbName}; CREATE DATABASE ${dbName}; \\c ${dbName}\n DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA drizzle CASCADE; CREATE SCHEMA drizzle;`,
      ),
      ensureDevScriptRunnerIsReady,
    ],
    { concurrency: 'unbounded' },
  )

  const closer = yield* Effect.forkScoped(closePsql)

  yield* fs.remove(migrationsDirPath, { force: true, recursive: true })

  const version = '8' as const
  const dialect = 'postgres' as const
  yield* fs.makeDirectory(migrationsMetaDirPath, { recursive: true })

  const schema = yield* Effect.promise(
    () => import(join(databasePackageDirPath, 'dist', 'src', 'schema.js')),
  )

  const newSnapshot = yield* Effect.promise(() => generateDrizzleJson(schema))

  // TODO: this shit needs a complete rewrite after they updated the format of the
  // migrations folder
  const sqlQueries = yield* Effect.promise(() =>
    generateMigration(
      {
        version,
        dialect,
        id: '00000000-0000-0000-0000-000000000000',
        prevIds: [],
        ddl: [],
        renames: [],
      },
      newSnapshot,
    ),
  )

  yield* Effect.all(
    [
      fs.writeFileString(
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
      fs.writeFileString(
        join(migrationsMetaDirPath, '0000_snapshot.json'),
        JSON.stringify(newSnapshot, null, 2),
      ),
      fs.writeFileString(
        join(migrationsDirPath, '0000_bright_marten_broadcloak.sql'),
        sqlQueries.map(q => q + '\n--> statement-breakpoint\n').join(''),
      ),
      Fiber.await(closer),
    ],
    { concurrency: 'unbounded', discard: true },
  )

  yield* passthroughSpawn(...(yield* drizzleKitMigrateDev))
  yield* Console.log()
}).pipe(
  Effect.scoped,
  Effect.provide(BunServices.layer),
  Effect.withSpan(import.meta.file),
  Effect.sandbox,
  Effect.catch(e => {
    console.error(Cause.pretty(e))

    return Effect.fail(e)
  }),
)

if (import.meta.main) BunRuntime.runMain(program)
