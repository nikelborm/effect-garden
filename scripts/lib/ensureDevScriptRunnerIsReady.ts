import { ensureDevComposeServiceIsRunning } from './ensureDevComposeServiceIsRunning.ts'

export async function ensureDevScriptRunnerIsReady() {
  await ensureDevComposeServiceIsRunning('ts-dev-script-runner')
}
