import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'

import { passthroughSpawnIgnoreError } from './passthroughSpawn.ts'

export const clearScreen = Effect.gen(function* () {
  yield* passthroughSpawnIgnoreError('tmux', 'clear-history')

  const CLEAR_BUFFER_KITTY = '\x1B[H\x1B[3J'

  yield* Console.log(CLEAR_BUFFER_KITTY)

  yield* passthroughSpawnIgnoreError('/sbin/clear')

  yield* Console.clear
}).pipe(Effect.withSpan('clearScreen'))
