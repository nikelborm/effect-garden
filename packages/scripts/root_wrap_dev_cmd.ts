#!/usr/bin/env bun

import { devComposeExecAsRootInScriptContainer } from './lib/composeCommands.ts'
import { ensureDevScriptRunnerIsReady } from './lib/ensureDevScriptRunnerIsReady.ts'
import { runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId } from './lib/runDevComposeCommandInheritArgs.ts'

await ensureDevScriptRunnerIsReady()

await runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId(
  ...devComposeExecAsRootInScriptContainer,
)
