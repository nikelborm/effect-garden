import { getDevComposeServiceInfo } from './getDevComposeServiceInfo.ts'

export async function isDevComposeServiceRunning(serviceName: string) {
  const service = await getDevComposeServiceInfo(serviceName)

  return service.State === 'running'
}
