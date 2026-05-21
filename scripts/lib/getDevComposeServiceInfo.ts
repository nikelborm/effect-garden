import { getDevComposeContainers } from './getComposeContainers.ts'

export async function getDevComposeServiceInfo(serviceName: string) {
  const containers = await getDevComposeContainers()

  const serviceInstance = containers.find(
    container => container.Service === serviceName,
  )

  if (!serviceInstance)
    throw new Error(
      `Service ${serviceName} wasn't found in output of \`docker compose ps\` command`,
    )

  return serviceInstance
}
