import { passthroughSpawnIgnoreError } from './passthroughSpawn.ts';

export async function clearScreen() {
  await passthroughSpawnIgnoreError('tmux', 'clear-history');

  const CLEAR_BUFFER_KITTY = '\x1B[H\x1B[3J';

  console.log(CLEAR_BUFFER_KITTY);

  await passthroughSpawnIgnoreError('/sbin/clear');

  console.clear();
}
