#!/usr/bin/env bun

import { executeSqlInDevPgContainer } from './lib/executeSqlInDevPgContainer.ts'

const { closePsql } = await executeSqlInDevPgContainer(
  dbName =>
    `\\c postgres\nDROP DATABASE IF EXISTS ${dbName}; CREATE DATABASE ${dbName}; \\c ${dbName}\n DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA drizzle CASCADE; CREATE SCHEMA drizzle;`,
)

await closePsql()
