import * as Stream from 'effect/Stream'

export const Uint8ArrayStreamToString = <E, R>(
  stream: Stream.Stream<Uint8Array<ArrayBufferLike>, E, R>,
) => stream.pipe(Stream.decodeText(), Stream.mkString)
