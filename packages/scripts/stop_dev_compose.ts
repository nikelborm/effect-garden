#!/usr/bin/env bun

import { runDevComposeCommandThatInheritsArgs } from './lib/runDevComposeCommandInheritArgs.ts';

await runDevComposeCommandThatInheritsArgs('stop');
