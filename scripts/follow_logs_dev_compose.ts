#!/usr/bin/env bun

import { runDevComposeCommandThatInheritsArgs } from './lib/runDevComposeCommandInheritArgs.ts'

// TODO: make smart algorithm that will print only logs since the first compose
// container was started in the current session
// docker logs --since=$(docker inspect -f '{{.State.StartedAt}}' your-container-name)

await runDevComposeCommandThatInheritsArgs('logs', '-f')
