import {
  createZstdCompress,
  createZstdDecompress,
  type ZstdOptions,
} from 'node:zlib'

import * as NodeStream from '@effect/platform-node-shared/NodeStream'
import type * as EArray from 'effect/Array'
import type * as Channel from 'effect/Channel'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import { dual } from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import type * as Stream from 'effect/Stream'

export interface MakeChannelBothSidesBinary<in out TAddedError> {
  /**
   * Makes a channel which lets you compress or decompress binary streams
   */
  <IE>(
    options?: Options | undefined,
  ): Channel.Channel<
    EArray.NonEmptyReadonlyArray<Uint8Array>,
    IE | TAddedError,
    void,
    EArray.NonEmptyReadonlyArray<Uint8Array>,
    IE
  >
}

export interface MakeCompressionChannel
  extends MakeChannelBothSidesBinary<ZstdCompressionError> {}

export interface MakeDecompressionChannel
  extends MakeChannelBothSidesBinary<ZstdDecompressionError> {}

export interface DualMakeStreamBothSidesBinary<in out TAddedError>
  extends MakeBinaryStreamTransformerWithInputStreamSuppliedLast<TAddedError>,
    TransformBinaryStreamWithInputStreamSuppliedFirst<TAddedError> {}

export interface MakeBinaryStreamTransformerWithInputStreamSuppliedLast<
  in out TAddedError,
> {
  /**
   * Makes a factory transforming binary streams to their de/compressed
   * variants. Intended to be used in pipes.
   */
  (options?: Options | undefined): TransformBinaryStream<TAddedError>
}

export interface TransformBinaryStream<in out TAddedError> {
  /**
   * Transforms binary streams to their de/compressed variants. Remembers
   * hardcoded options applied earlier.
   */
  <E, R>(
    rawInputStream: Stream.Stream<Uint8Array, E, R>,
  ): Stream.Stream<Uint8Array, TAddedError | E, R>
}

export interface TransformBinaryStreamWithInputStreamSuppliedFirst<
  in out TAddedError,
> {
  /**
   * Transforming binary streams to their de/compressed variants, with potential
   * configuration options
   */
  <E, R>(
    rawInputStream: Stream.Stream<Uint8Array, E, R>,
    options?: Options | undefined,
  ): Stream.Stream<Uint8Array, TAddedError | E, R>
}

export interface DualCompressStream
  extends DualMakeStreamBothSidesBinary<ZstdCompressionError> {}
export interface DualDecompressStream
  extends DualMakeStreamBothSidesBinary<ZstdDecompressionError> {}

export interface Shape {
  makeCompressionChannel: MakeCompressionChannel
  compressStream: DualCompressStream
  makeDecompressionChannel: MakeDecompressionChannel
  decompressStream: DualDecompressStream
}

export class Service extends Context.Service<Service, Shape>()(
  'effect-zstd/ZStd/Service',
) {}

export const layer = Effect.gen(function* (): Effect.gen.Return<Shape> {
  const makeCompressionChannel: MakeCompressionChannel = options =>
    NodeStream.fromDuplex({
      ...options?.streamOptions,
      evaluate: () => createZstdCompress(options?.zstdOptions),
      onError: ZstdCompressionError.fromCause,
    })

  const compressStream: DualCompressStream = dual<
    MakeBinaryStreamTransformerWithInputStreamSuppliedLast<ZstdCompressionError>,
    TransformBinaryStreamWithInputStreamSuppliedFirst<ZstdCompressionError>
  >(2, (rawInputStream, options) =>
    NodeStream.pipeThroughDuplex(rawInputStream, {
      ...options?.streamOptions,
      evaluate: () => createZstdCompress(options?.zstdOptions),
      onError: ZstdCompressionError.fromCause,
    }),
  )

  const makeDecompressionChannel: MakeDecompressionChannel = options =>
    NodeStream.fromDuplex({
      ...options?.streamOptions,
      evaluate: () => createZstdDecompress(options?.zstdOptions),
      onError: ZstdDecompressionError.fromCause,
    })

  const decompressStream: DualDecompressStream = dual<
    MakeBinaryStreamTransformerWithInputStreamSuppliedLast<ZstdDecompressionError>,
    TransformBinaryStreamWithInputStreamSuppliedFirst<ZstdDecompressionError>
  >(2, (inputStream, options) =>
    NodeStream.pipeThroughDuplex(inputStream, {
      ...options?.streamOptions,
      evaluate: () => createZstdDecompress(options?.zstdOptions),
      onError: ZstdDecompressionError.fromCause,
    }),
  )

  return {
    makeCompressionChannel,
    compressStream,
    makeDecompressionChannel,
    decompressStream,
  }
}).pipe(Layer.effect(Service))

export class ZstdDecompressionError extends Schema.TaggedError<ZstdDecompressionError>()(
  'effect-zstd/ZStd/ZstdDecompressionError',
  { cause: Schema.Unknown },
) {
  static fromCause = (cause: unknown) => new ZstdDecompressionError({ cause })
}

export class ZstdCompressionError extends Schema.TaggedError<ZstdCompressionError>()(
  'effect-zstd/ZStd/ZstdCompressionError',
  { cause: Schema.Unknown },
) {
  static fromCause = (cause: unknown) => new ZstdCompressionError({ cause })
}

export interface Options {
  zstdOptions?: ZstdOptions | undefined
  streamOptions?:
    | Omit<Parameters<typeof NodeStream.fromDuplex>[0], 'evaluate' | 'onError'>
    | undefined
}
