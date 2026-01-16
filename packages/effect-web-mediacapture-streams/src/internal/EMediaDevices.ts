import * as Effect from 'effect/Effect'

import * as MediaErrors from './MediaErrors.ts'

/**
 * Requests the list of specific available devices, or their general availability
 *
 * @example
 * ```ts
 * import * as EMediaDevices from 'effect-web-audio/EMediaDevices'
 *
 * const audioBufferOrError = EMediaDevices.enumerate
 * ```
 */
export const enumerate = Effect.tryPromise({
  try: () =>
    navigator.mediaDevices.enumerateDevices() as Promise<
      (MediaDeviceInfo | InputDeviceInfo)[]
    >,
  catch: MediaErrors.remapErrorByName(
    {
      NotSupportedError: MediaErrors.MediaDeviceEnumerationNotSupportedError,
      // For case when navigator doesn't exist
      ReferenceError: MediaErrors.MediaDeviceEnumerationNotSupportedError,
      // For case when navigator.mediaDevices.enumerateDevices is undefined
      TypeError: MediaErrors.MediaDeviceEnumerationNotSupportedError,
    },
    'EMIDIAccess.request error handling absurd',
    {},
  ),
}).pipe(
  Effect.map(e => e),
  Effect.withSpan('EMediaDevices.enumerate'),
)
