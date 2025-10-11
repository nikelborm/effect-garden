#!/usr/bin/env bun

import { mkdir } from 'fs/promises'
import { projectTurboCacheDirPath } from './lib/paths.ts'
import { runDevComposeCommandThatInheritsArgs } from './lib/runDevComposeCommandInheritArgs.ts'

await mkdir(projectTurboCacheDirPath, { recursive: true })

await runDevComposeCommandThatInheritsArgs('start')
