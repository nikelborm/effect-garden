#!/usr/bin/env bun

import { mkdir } from 'node:fs/promises'

import { devComposeUpDetached } from './lib/composeCommands.ts'
import { projectTurboCacheDirPath } from './lib/paths.ts'
import { runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId } from './lib/runDevComposeCommandInheritArgs.ts'

await mkdir(projectTurboCacheDirPath, { recursive: true })

await runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId(...devComposeUpDetached)
