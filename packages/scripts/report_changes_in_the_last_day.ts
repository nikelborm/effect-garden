#!/usr/bin/env bun

import { $ } from 'bun'

const now = new Date()

const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes()

await $`xdg-open https://github.com/nikelborm/effect-garden/compare/main%40%7B${minutesSinceMidnight}minutes%7D...main`
