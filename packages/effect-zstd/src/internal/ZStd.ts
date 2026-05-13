import {
  createZstdCompress,
  createZstdDecompress,
  type ZstdOptions,
} from 'node:zlib'

import * as NodeStream from '@effect/platform-node-shared/NodeStream'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import type * as Stream from 'effect/Stream'

export class ZStd extends Effect.Service<ZStd>()('ZStd', {
  accessors: true,
  effect: Effect.gen(function* () {
    const makeCompressionChannel = <IE>(options?: Options) =>
      NodeStream.fromDuplex<IE, ZstdCompressionError, Uint8Array, Uint8Array>(
        () => createZstdCompress(options?.zstdOptions),
        ZstdCompressionError.fromCause,
        options?.streamOptions,
      )

    const compressStream =
      (options?: Options) =>
      <E, R>(self: Stream.Stream<Uint8Array, E, R>) =>
        NodeStream.pipeThroughDuplex(
          self,
          () => createZstdCompress(options?.zstdOptions),
          ZstdCompressionError.fromCause,
          options?.streamOptions,
        )

    const makeDecompressionChannel = <IE>(options?: Options) =>
      NodeStream.fromDuplex<IE, ZstdDecompressionError, Uint8Array, Uint8Array>(
        () => createZstdDecompress(options?.zstdOptions),
        ZstdDecompressionError.fromCause,
        options?.streamOptions,
      )

    const decompressStream =
      (options?: Options) =>
      <E, R>(self: Stream.Stream<Uint8Array, E, R>) =>
        NodeStream.pipeThroughDuplex(
          self,
          () => createZstdDecompress(options?.zstdOptions),
          ZstdDecompressionError.fromCause,
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
  'effect-zstd/ZstdDecompressionError',
  { cause: Schema.Unknown },
) {
  static fromCause = (cause: unknown) => new ZstdDecompressionError({ cause })
}

export class ZstdCompressionError extends Schema.TaggedError<ZstdCompressionError>()(
  'effect-zstd/ZstdCompressionError',
  { cause: Schema.Unknown },
) {
  static fromCause = (cause: unknown) => new ZstdCompressionError({ cause })
}

type Options = {
  zstdOptions?: ZstdOptions | undefined
  streamOptions?:
    | (NodeStream.FromReadableOptions & NodeStream.FromWritableOptions)
    | undefined
}
