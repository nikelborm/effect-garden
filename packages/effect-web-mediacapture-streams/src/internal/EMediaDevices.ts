import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'

import * as EMediaDeviceInfo from './EMediaDeviceInfo.ts'
import * as MediaErrors from './MediaErrors.ts'

/**
 * Requests the list of specific available devices, or their general availability
 *
 * @example
 * ```ts
 * import * as EMediaDevices from 'effect-web-mediacapture-streams/EMediaDevices'
 * import * as Effect from 'effect/Effect'
 *
 * const mediaDeviceInfoArray = EMediaDevices.enumerate.pipe(
 *   Effect.runPromise,
 *   console.log
 * )
 * ```
 */
export const enumerate = Effect.tryPromise({
  try: () => navigator.mediaDevices.enumerateDevices(),
  catch: MediaErrors.remapErrorByName(
    {
      NotSupportedError: MediaErrors.MediaDeviceEnumerationNotSupportedError,
      // For case when navigator doesn't exist
      ReferenceError: MediaErrors.MediaDeviceEnumerationNotSupportedError,
      // For case when navigator.mediaDevices.enumerateDevices is undefined
      TypeError: MediaErrors.MediaDeviceEnumerationNotSupportedError,
    },
    'EMediaDevices.enumerate error handling absurd',
    {},
  ),
}).pipe(
  Effect.map(EArray.map(EMediaDeviceInfo.make)),
  Effect.withSpan('EMediaDevices.enumerate'),
)
