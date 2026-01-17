import * as Equal from 'effect/Equal'
import * as Hash from 'effect/Hash'
import * as Inspectable from 'effect/Inspectable'
import * as Pipeable from 'effect/Pipeable'
import * as EString from 'effect/String'

import type * as MediaBrand from './MediaBrand.ts'

// TODO: fuzzing property-based testing all of the arrays to catch more errors

/**
 * Unique symbol used for distinguishing {@linkcode EMediaDeviceInfo}s from
 * other objects at both runtime and type-level
 * @internal
 */
const TypeId: unique symbol = Symbol.for(
  'effect-web-mediacapture-streams/EMediaDeviceInfo',
)

/**
 * Unique symbol used for distinguishing {@linkcode EMediaDeviceInfo}s from
 * other objects at both runtime and type-level
 */
export type TypeId = typeof TypeId

/**
 * Prototype of all objects satisfying the {@linkcode EMediaDeviceInfo} type.
 * @internal
 */
const Proto = {
  _tag: 'EMediaDeviceInfo' as const,
  [TypeId]: TypeId,
  [Hash.symbol](this: EMediaDeviceInfoImpl) {
    return Hash.structure(assumeImpl(this)._info)
  },
  [Equal.symbol](that: Equal.Equal) {
    return (
      typeof that === 'object' &&
      that !== null &&
      'deviceId' in that &&
      'groupId' in that &&
      'kind' in that &&
      'label' in that &&
      this.deviceId === that.deviceId &&
      this.groupId === that.groupId &&
      this.kind === that.kind &&
      this.label === that.label
    )
  },
  pipe() {
    // biome-ignore lint/complexity/noArguments: Effect's tradition
    return Pipeable.pipeArguments(this, arguments)
  },
  toString() {
    return EString.stripMargin(`
      |EMediaDeviceInfo({
      |  deviceId: "${this.deviceId}",
      |  groupId: "${this.groupId}",
      |  kind: "${this.kind}",
      |  label: "${this.label}"
      |})
    `)
  },
  toJSON() {
    return {
      _id: 'EMediaDeviceInfo',
      ...this._info.toJSON(),
    }
  },
  [Inspectable.NodeInspectSymbol](
    depth: number,
    options: any,
    inspect: (...args: any[]) => any,
  ) {
    return depth < 0
      ? options.stylize('[EMediaDeviceInfo]', 'special')
      : inspect(
          { _id: 'EMediaDeviceInfo', ...this._info.toJSON() },
          {
            ...options,
            depth: options.depth === null ? null : options.depth - 1,
          },
        )
  },

  get deviceId() {
    return assumeImpl(this)._info.deviceId
  },

  get groupId() {
    return assumeImpl(this)._info.groupId
  },

  get kind() {
    return assumeImpl(this)._info.kind
  },

  get label() {
    return assumeImpl(this)._info.label
  },
} as EMediaDeviceInfoImpl

/**
 * Thin wrapper around raw {@linkcode MediaDeviceInfo} instance. Will be seen in
 * all the external code.
 */
export interface EMediaDeviceInfo
  extends Equal.Equal,
    Pipeable.Pipeable,
    Inspectable.Inspectable {
  readonly [TypeId]: TypeId
  readonly _tag: 'EMediaDeviceInfo'

  /**
   * A string identifier for the represented device that is persisted across
   * sessions. It is un-guessable by other applications and unique to the origin
   * of the calling application. It is reset when the user clears cookies (for
   * Private Browsing, a different identifier is used that is not persisted
   * across sessions)
   */
  readonly deviceId: MediaBrand.DeviceId

  /**
   * A string that is a group identifier. Two devices have the same
   * group identifier if they belong to the same physical device — for example a
   * monitor with both a built-in camera and a microphone.
   */
  readonly groupId: MediaBrand.DeviceGroupId

  /**
   * Returns an enumerated value that is either `"videoinput"`, `"audioinput"` or
   * `"audiooutput"`.
   */
  readonly kind: MediaDeviceKind

  /**
   * Returns a string describing this device (for example "External USB
   * Webcam"). For security reasons, the label field is always blank unless an
   * active media stream exists or the user has granted persistent permission
   * for media device access. The set of device labels could otherwise be used
   * as part of a fingerprinting mechanism to identify a user.
   */
  readonly label: MediaBrand.DeviceLabel
}

/**
 * Thin wrapper around raw {@linkcode MediaDeviceInfo} instance giving access to
 * the actual field storing it.
 * @internal
 */
interface EMediaDeviceInfoImpl extends EMediaDeviceInfo {
  readonly _info: MediaDeviceInfo
}

/**
 * @param rawMediaDeviceInfo The raw {@linkcode MediaDeviceInfo} object from the
 * browser's Media Capture and Streams API to be wrapped.
 *
 * @internal
 * @example
 * ```ts
 * const rawMediaDeviceInfo = (await navigator.mediaDevices.enumerateDevices())[0];
 * const internalInstance = makeImpl(rawMediaDeviceInfo);
 * ```
 */
const makeImpl = (
  rawMediaDeviceInfo: MediaDeviceInfo,
): EMediaDeviceInfoImpl => {
  const instance = Object.create(Proto)
  instance._info = rawMediaDeviceInfo
  return instance
}

/**
 * Creates a public-facing {@linkcode EMediaDeviceInfo} from a raw
 * {@linkcode MediaDeviceInfo} object. Prevents revealing internal fields set by
 * `effect-web-mediacapture-streams` to the end user.
 *
 * @example
 * ```ts
 * import * as EMediaDeviceInfo from 'effect-web-mediacapture-streams/EMediaDeviceInfo'
 *
 * const rawMediaDeviceInfo = (await navigator.mediaDevices.enumerateDevices())[0];
 * const mediaDeviceInfoOrError = EMediaDeviceInfo.make(rawMediaDeviceInfo)
 * ```
 */
export const make = (info: MediaDeviceInfo): EMediaDeviceInfo => makeImpl(info)

/**
 * Asserts that an `unknown` value is a valid {@linkcode EMediaDeviceInfoImpl}
 * and casts it to the type. Throws an error if the assertion fails.
 *
 * @internal
 * @example
 * ```ts
 * const unknownValue: null | EMediaDeviceInfo = null
 * try {
 *   const validatedMediaDeviceInfo = assertImpl(unknownValue);
 *   // validatedMediaDeviceInfo is now known to be EMediaDeviceInfoImpl
 * } catch (error) {
 *   console.error("Assertion failed:", error);
 * }
 * ```
 */
const assertImpl = (mediaDeviceInfo: unknown) => {
  if (!isImpl(mediaDeviceInfo))
    throw new Error('Failed to cast to EMediaDeviceInfo')
  return mediaDeviceInfo
}

/**
 * Asserts that an `unknown` value is a valid {@linkcode EMediaDeviceInfo} and
 * casts it to the type. Throws an error if the assertion fails.
 *
 * @internal
 * @example
 * ```ts
 * import * as EMediaDeviceInfo from 'effect-web-mediacapture-streams/EMediaDeviceInfo';
 *
 * const unknownValue: null | EMediaDeviceInfo.EMediaDeviceInfo = null
 *
 * try {
 *   const validatedMediaDeviceInfo = EMediaDeviceInfo.assert(unknownValue);
 *   // validatedMediaDeviceInfo is now known to be EMediaDeviceInfo.EMediaDeviceInfo
 * } catch (error) {
 *   console.error("Assertion failed:", error);
 * }
 * ```
 *
 * @see {@linkcode is|EMediaDeviceInfo.is}
 */
export const assert: (mediaDeviceInfo: unknown) => EMediaDeviceInfo = assertImpl

/**
 * Purely a type-level typecast to expose internal fields. Does no runtime
 * validation and assumes you provided {@linkcode EMediaDeviceInfo} acquired
 * legitimately from `effect-web-mediacapture-streams`.
 *
 * @internal
 * @example
 * ```ts
 * // Assume `mediaDeviceInfoInstance` is known to be an internal implementation
 * declare const mediaDeviceInfoPublic: EMediaDeviceInfo.EMediaDeviceInfo;
 * const mediaDeviceInfoInternal = assumeImpl(mediaDeviceInfoPublic);
 * console.log('No type error here: ', mediaDeviceInfoInternal._info)
 * ```
 */
export const assumeImpl = (mediaDeviceInfo: EMediaDeviceInfo) =>
  mediaDeviceInfo as EMediaDeviceInfoImpl

/**
 * @internal
 * @example
 * ```ts
 * const mediaDeviceInfoOrNot: null | EMediaDeviceInfo = null
 *
 * if (isImpl(mediaDeviceInfoOrNot)) {
 *   const mediaDeviceInfoInternal = mediaDeviceInfoOrNot;
 *   // will not be logged
 *   console.log('No type error here: ', mediaDeviceInfoInternal._info)
 * } else {
 *   console.log('This will be logged because null is not EMediaDeviceInfo')
 * }
 * ```
 */
const isImpl = (
  mediaDeviceInfo: unknown,
): mediaDeviceInfo is EMediaDeviceInfoImpl =>
  typeof mediaDeviceInfo === 'object' &&
  mediaDeviceInfo !== null &&
  Object.getPrototypeOf(mediaDeviceInfo) === Proto &&
  TypeId in mediaDeviceInfo &&
  '_info' in mediaDeviceInfo &&
  typeof mediaDeviceInfo._info === 'object' &&
  mediaDeviceInfo._info instanceof MediaDeviceInfo

/**
 * @example
 * ```ts
 * import * as EMediaDeviceInfo from 'effect-web-mediacapture-streams/EMediaDeviceInfo';
 *
 * const mediaDeviceInfoOrNot: null | EMediaDeviceInfo.EMediaDeviceInfo = null
 *
 * if (EMediaDeviceInfo.is(mediaDeviceInfoOrNot)) {
 *   const mediaDeviceInfoPublic = mediaDeviceInfoOrNot;
 *   // ts-expect-error You're exposed only to public facing fields
 *   console.log(mediaDeviceInfoPublic._info)
 *   // will not be logged
 * } else {
 *   console.log('This will be logged because null is not EMediaDeviceInfo')
 * }
 * ```
 *
 * @see {@linkcode assert|EMediaDeviceInfo.assert}
 */
export const is: (
  mediaDeviceInfo: unknown,
) => mediaDeviceInfo is EMediaDeviceInfo = isImpl
