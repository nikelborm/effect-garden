#!/usr/bin/env bun

import { drizzleKitGenerateMigrationDev } from './lib/composeCommands.ts'
import { ensureDevScriptRunnerIsReady } from './lib/ensureDevScriptRunnerIsReady.ts'
import { runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId } from './lib/runDevComposeCommandInheritArgs.ts'

await ensureDevScriptRunnerIsReady()

console.log('Script runner is ready')

await runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId(
  ...drizzleKitGenerateMigrationDev,
)
