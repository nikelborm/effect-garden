import * as Effect from 'effect/Effect'

import { getDevComposeServiceInfo } from './getDevComposeServiceInfo.ts'

export const isDevComposeServiceRunning = Effect.fn('isDevComposeServiceRunning')(
  function* (serviceName: string) {
    const service = yield* getDevComposeServiceInfo(serviceName)

    return service.State === 'running'
  },
)
