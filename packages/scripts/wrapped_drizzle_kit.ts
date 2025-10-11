#!/usr/bin/env bun

import { execDrizzleKitInDevScriptContainer } from './lib/composeCommands.ts'
import { ensureDevScriptRunnerIsReady } from './lib/ensureDevScriptRunnerIsReady.ts'
import { ensurePgDevIsHealthy } from './lib/ensurePgDevIsHealthy.ts'
import { runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId } from './lib/runDevComposeCommandInheritArgs.ts'

await Promise.all([ensureDevScriptRunnerIsReady(), ensurePgDevIsHealthy()])

console.log('Script runner and db are ready')

await runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId(
  ...execDrizzleKitInDevScriptContainer,
)
