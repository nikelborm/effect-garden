import * as Effect from 'effect/Effect'

import { getDevComposeContainers } from './getComposeContainers.ts'

export const getDevComposeServiceInfo = Effect.fn('getDevComposeServiceInfo')(
  function* (serviceName: string) {
    const containers = yield* getDevComposeContainers

    const serviceInstance = containers.find(
      container => container.Service === serviceName,
    )

    if (!serviceInstance)
      return yield* Effect.fail(
        new Error(
          `Service ${serviceName} wasn't found in output of \`docker compose ps\` command`,
        ),
      )

    return serviceInstance
  },
)
