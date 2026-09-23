#!/usr/bin/env bun

import { $ } from 'bun'

const now = new Date()

// const branch = 'claude-test'
const branch = 'main'

const dayInMinutes = 24 * 60
const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes()
const _minutesSincePreviousMidnight = dayInMinutes + minutesSinceMidnight

const url =
  'https://github.com/nikelborm/effect-garden/compare/' +
  encodeURIComponent(`${branch}@{${minutesSinceMidnight}minutes}...${branch}`)

await $`xdg-open ${url}`
