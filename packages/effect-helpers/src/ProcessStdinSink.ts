import { type PlatformError, SystemError } from '@effect/platform/Error'
import * as NodeSink from '@effect/platform-node-shared/NodeSink'
import type * as Sink from 'effect/Sink'

export const ProcessStdinSink: Sink.Sink<
  void,
  string | Uint8Array,
  never,
  PlatformError
> = NodeSink.fromWritable(
  () => process.stdin,
  cause =>
    new SystemError({
      module: 'Stream',
      method: 'stdin',
      reason: 'Unknown',
      cause,
    }),
  // has bad default (true) in upstream repo V3. Fixed in V4 https://github.com/Effect-TS/effect-smol/pull/1671
  { endOnDone: false },
)
