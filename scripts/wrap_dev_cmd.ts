#!/usr/bin/env bun

import { devComposeExecInScriptContainer } from './lib/composeCommands.ts'
import { ensureDevScriptRunnerIsReady } from './lib/ensureDevScriptRunnerIsReady.ts'
import { runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId } from './lib/runDevComposeCommandInheritArgs.ts'

await ensureDevScriptRunnerIsReady()

await runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId(
  ...devComposeExecInScriptContainer,
)
