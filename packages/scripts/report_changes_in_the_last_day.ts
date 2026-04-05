#!/usr/bin/env bun

import { $ } from 'bun'

const now = new Date()

const branch = 'claude-test'
// const branch = 'main'

const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes()

const url =
  'https://github.com/nikelborm/effect-garden/compare/' +
  encodeURIComponent(`${branch}@{${minutesSinceMidnight}minutes}...${branch}`)

await $`xdg-open ${url}`
