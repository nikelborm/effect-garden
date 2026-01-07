import { Readable } from 'node:stream'
import { ReadableStream } from 'node:stream/web'

import { type Effect, gen } from 'effect/Effect'

import {
  buildTaggedErrorClassVerifyingCause,
  type TaggedErrorClass,
} from './TaggedErrorVerifyingCause.ts'

export const CastToReadableStream = <E, R>(self: Effect<unknown, E, R>) =>
  gen(function* () {
    const data = yield* self

    if (data instanceof ArrayBuffer || data instanceof Buffer)
      return new Readable({
        read() {
          this.push(data)
          this.push(null)
        },
      })

    if (data instanceof ReadableStream) return Readable.fromWeb(data)

    if (data instanceof Readable) return data

    return yield* new FailedToCastDataToReadableStreamError()
  })

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
const _1: TaggedErrorClass<{
  ErrorName: 'FailedToCastDataToReadableStreamError'
}> = buildTaggedErrorClassVerifyingCause()(
  'FailedToCastDataToReadableStreamError',
  'Error: Failed to cast data to Readable stream, type of argument is not familiar',
)

export class FailedToCastDataToReadableStreamError extends _1 {}
