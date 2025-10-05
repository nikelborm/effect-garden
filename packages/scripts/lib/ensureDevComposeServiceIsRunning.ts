import { devComposeStart } from './composeCommands.ts';
import { getDevComposeServiceInfo } from './getDevComposeServiceInfo.ts';
import { passthroughSpawn } from './passthroughSpawn.ts';

export async function ensureDevComposeServiceIsRunning(serviceName: string) {
  let serviceInfo = await getDevComposeServiceInfo(serviceName);

  const isServiceStrivesToBeRunning = () =>
    serviceInfo.State === 'created' || serviceInfo.State === 'restarting';

  const isServiceRunning = () => serviceInfo.State === 'running';

  const isServiceFuckedUp = () =>
    !(isServiceRunning() || isServiceStrivesToBeRunning());

  if (isServiceRunning()) return;

  if (!isServiceStrivesToBeRunning())
    await passthroughSpawn(...devComposeStart, serviceName);

  const timeoutMs = 5000;

  const signal = AbortSignal.timeout(timeoutMs);

  do {
    await Bun.sleep(200);
    serviceInfo = await getDevComposeServiceInfo(serviceName);
  } while (
    !isServiceFuckedUp() &&
    // @ts-ignore
    !signal.aborted &&
    isServiceStrivesToBeRunning()
  );

  // @ts-ignore
  if (signal.aborted)
    throw new Error(
      `Failed to enforce running state. Timed-out after ${
        timeoutMs / 1000
      } seconds`,
    );

  if (serviceInfo.State !== 'running')
    throw new Error(
      `Running command to start container for ${serviceName} service din't have any effect. Service status currently is "${serviceInfo.State}"`,
    );
}
