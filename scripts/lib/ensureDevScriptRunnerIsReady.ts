import * as Effect from 'effect/Effect'

import { ensureDevComposeServiceIsRunning } from './ensureDevComposeServiceIsRunning.ts'

export const ensureDevScriptRunnerIsReady = ensureDevComposeServiceIsRunning(
  'ts-dev-script-runner',
).pipe(Effect.withSpan('ensureDevScriptRunnerIsReady'))
