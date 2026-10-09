#!/usr/bin/env bun

import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'

import { clearScreen } from './lib/clearScreen.ts'
import { ensurePgDevIsHealthy } from './lib/ensurePgDevIsHealthy.ts'
import { runDevComposeCommandThatInheritsArgs } from './lib/runDevComposeCommandInheritArgs.ts'

const program = Effect.gen(function* () {
  yield* clearScreen

  yield* ensurePgDevIsHealthy

  yield* runDevComposeCommandThatInheritsArgs(
    '--profile',
    'use_pgcli',
    'run',
    '--remove-orphans',
    'pgcli-dev',
  )
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
