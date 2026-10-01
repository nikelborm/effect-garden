// Remote mode — provider side (`qcode provide`, run on the remote host).

import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import { ExitCode } from 'effect/process/ChildProcessSpawner'

import { MARKER_READY } from './common.ts'

// For now this only completes the handshake by announcing itself. Streaming
// the remote project list back to the controller is the next step.
export const runProvider = Effect.gen(function* () {
  yield* Console.log(MARKER_READY)
  yield* Console.log(`provider online: ${import.meta.path}`)
  return ExitCode(0)
}).pipe(Effect.withSpan('qcode.provider'))
