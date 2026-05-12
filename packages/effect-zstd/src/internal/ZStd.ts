import {
  createZstdCompress,
  createZstdDecompress,
  type ZstdOptions,
} from 'node:zlib'

import * as ServerRuntimeStream from '@effect/platform-node-shared/NodeStream'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import type * as Stream from 'effect/Stream'

export class ZStd extends Effect.Service<ZStd>()('ZStd', {
  accessors: true,
  effect: Effect.gen(function* () {
    const makeCompressionChannel = <IE>(options?: Options) =>
      ServerRuntimeStream.fromDuplex<
        IE,
        ZstdCompressionError,
        Uint8Array<ArrayBufferLike>,
        Uint8Array<ArrayBufferLike>
      >(
        () => createZstdCompress(options?.zstdOptions),
        cause => new ZstdCompressionError({ cause }),
        options?.streamOptions,
      )

    const compressStream =
      (options?: Options) =>
      <E, R>(self: Stream.Stream<Uint8Array<ArrayBufferLike>, E, R>) =>
        ServerRuntimeStream.pipeThroughDuplex(
          self,
          () => createZstdCompress(options?.zstdOptions),
          cause => new ZstdCompressionError({ cause }),
          options?.streamOptions,
        )

    const makeDecompressionChannel = <IE>(options?: Options) =>
      ServerRuntimeStream.fromDuplex<
        IE,
        ZstdDecompressionError,
        Uint8Array<ArrayBufferLike>,
        Uint8Array<ArrayBufferLike>
      >(
        () => createZstdDecompress(options?.zstdOptions),
        cause => new ZstdDecompressionError({ cause }),
        options?.streamOptions,
      )

    const decompressStream =
      (options?: Options) =>
      <E, R>(self: Stream.Stream<Uint8Array<ArrayBufferLike>, E, R>) =>
        ServerRuntimeStream.pipeThroughDuplex(
          self,
          () => createZstdDecompress(options?.zstdOptions),
          cause => new ZstdDecompressionError({ cause }),
          options?.streamOptions,
        )

    return {
      makeCompressionChannel,
      compressStream,
      makeDecompressionChannel,
      decompressStream,
    }
  }),
}) {}

export class ZstdDecompressionError extends Schema.TaggedError<ZstdDecompressionError>()(
  'ZstdDecompressionError',
  { cause: Schema.Unknown },
) {}

export class ZstdCompressionError extends Schema.TaggedError<ZstdCompressionError>()(
  'ZstdCompressionError',
  { cause: Schema.Unknown },
) {}

type Options = {
  zstdOptions?: ZstdOptions
  streamOptions: ServerRuntimeStream.FromReadableOptions &
    ServerRuntimeStream.FromWritableOptions
}
