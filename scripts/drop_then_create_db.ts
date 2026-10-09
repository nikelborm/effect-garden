#!/usr/bin/env bun

import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'

import { executeSqlInDevPgContainer } from './lib/executeSqlInDevPgContainer.ts'

const program = Effect.gen(function* () {
  const { closePsql } = yield* executeSqlInDevPgContainer(
    dbName =>
      `\\c postgres\nDROP DATABASE IF EXISTS ${dbName}; CREATE DATABASE ${dbName}; \\c ${dbName}\n DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA drizzle CASCADE; CREATE SCHEMA drizzle;`,
  )

  yield* closePsql
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
