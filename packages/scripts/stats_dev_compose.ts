#!/usr/bin/env bun

import { runDevComposeCommandThatInheritsArgs } from './lib/runDevComposeCommandInheritArgs.ts'

await runDevComposeCommandThatInheritsArgs('stats', '--no-stream')
