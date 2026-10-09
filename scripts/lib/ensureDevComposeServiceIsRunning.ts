import * as Effect from 'effect/Effect'

import { devComposeStart } from './composeCommands.ts'
import { getDevComposeServiceInfo } from './getDevComposeServiceInfo.ts'
import { passthroughSpawn } from './passthroughSpawn.ts'

export const ensureDevComposeServiceIsRunning = Effect.fn(
  'ensureDevComposeServiceIsRunning',
)(function* (serviceName: string) {
  const serviceInfoEffect = Effect.map(
    getDevComposeServiceInfo(serviceName),
    info => {
      const isServiceStrivesToBeRunning =
        info.State === 'created' || info.State === 'restarting'
      const isServiceRunning = info.State === 'running'
      const isServiceFuckedUp = !(
        isServiceRunning || isServiceStrivesToBeRunning
      )
      return {
        ...info,
        isServiceStrivesToBeRunning,
        isServiceRunning,
        isServiceFuckedUp,
      }
    },
  )

  let serviceInfo = yield* serviceInfoEffect

  if (serviceInfo.isServiceRunning) return

  if (!serviceInfo.isServiceStrivesToBeRunning)
    yield* passthroughSpawn(...(yield* devComposeStart), serviceName)

  const timeoutMs = 5000

  yield* Effect.gen(function* () {
    do {
      yield* Effect.sleep('200 millis')
      serviceInfo = yield* serviceInfoEffect
    } while (
      !serviceInfo.isServiceFuckedUp &&
      serviceInfo.isServiceStrivesToBeRunning
    )
  }).pipe(Effect.timeout(timeoutMs))

  if (serviceInfo.State !== 'running')
    return yield* Effect.fail(
      new Error(
        `Running command to start container for ${serviceName} service din't have any effect. Service status currently is "${serviceInfo.State}"`,
      ),
    )
})
