import * as Brand from 'effect/Brand'
import * as Effect from 'effect/Effect'
import * as Either from 'effect/Either'
import * as Equal from 'effect/Equal'
import * as Hash from 'effect/Hash'
import * as Inspectable from 'effect/Inspectable'
import * as Pipeable from 'effect/Pipeable'
import * as EString from 'effect/String'

import * as MediaBrand from './MediaBrand.ts'

// TODO: fuzzing property-based testing all of the arrays to catch more errors

/**
 * Unique symbol used for distinguishing {@linkcode EInputDeviceInfo}s from
 * other objects at both runtime and type-level
 * @internal
 */
const TypeId: unique symbol = Symbol.for(
  'effect-web-mediacapture-streams/EInputDeviceInfo',
)

/**
 * Unique symbol used for distinguishing {@linkcode EInputDeviceInfo}s from
 * other objects at both runtime and type-level
 */
export type TypeId = typeof TypeId

/**
 * Prototype of all objects satisfying the {@linkcode EInputDeviceInfo} type.
 * @internal
 */
const Proto = {
  _tag: 'EInputDeviceInfo' as const,
  [TypeId]: TypeId,
  [Hash.symbol](this: EInputDeviceInfoImpl) {
    return Hash.structure(assumeImpl(this)._info)
  },
  [Equal.symbol](that: Equal.Equal) {
    return (
      typeof that === 'object' &&
      that !== null &&
      'deviceId' in that &&
      this.deviceId === that.deviceId
    )
  },
  pipe() {
    // biome-ignore lint/complexity/noArguments: Effect's tradition
    return Pipeable.pipeArguments(this, arguments)
  },
  toString() {
    return EString.stripMargin(`
      |EInputDeviceInfo({
      |  deviceId: "${this.deviceId}",
      |  groupId: "${this.groupId}",
      |  kind: "${this.kind}",
      |  label: "${this.label}"
      |})
    `)
  },
  toJSON() {
    return {
      _id: 'EInputDeviceInfo',
      ...this._info.toJSON(),
    }
  },
  [Inspectable.NodeInspectSymbol](
    depth: number,
    options: any,
    inspect: (...args: any[]) => any,
  ) {
    return depth < 0
      ? options.stylize('[EInputDeviceInfo]', 'special')
      : inspect(
          { _id: 'EInputDeviceInfo', ...this._info.toJSON() },
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
} as EInputDeviceInfoImpl

/**
 * Thin wrapper around raw {@linkcode InputDeviceInfo} instance. Will be seen in
 * all the external code.
 */
export interface EInputDeviceInfo
  extends Equal.Equal,
    Pipeable.Pipeable,
    Inspectable.Inspectable {
  readonly [TypeId]: TypeId
  readonly _tag: 'EInputDeviceInfo'

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
   * Returns an enumerated value that is either `"videoinput"`, `"audioinput"`.
   */
  readonly kind: 'audioinput' | 'videoinput'

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
 * Thin wrapper around raw {@linkcode InputDeviceInfo} instance giving access to
 * the actual field storing it.
 * @internal
 */
interface EInputDeviceInfoImpl extends EInputDeviceInfo {
  readonly _info: InputDeviceInfo
}

/**
 * @param rawInputDeviceInfo The raw {@linkcode InputDeviceInfo} object from the
 * browser's Media Capture and Streams API to be wrapped.
 *
 * @internal
 * @example
 * ```ts
 * const rawInputDeviceInfo = (await navigator.mediaDevices.enumerateDevices())[0];
 * const internalInstance = makeImpl(rawInputDeviceInfo);
 * ```
 */
const makeImpl = (
  rawInputDeviceInfo: InputDeviceInfo,
): EInputDeviceInfoImpl => {
  const instance = Object.create(Proto)
  instance._info = rawInputDeviceInfo
  return instance
}

const testKind = Either.liftPredicate(
  (kind: string) => kind === 'audioinput' || kind === 'videoinput',
  kind =>
    Brand.error(`kind is "${kind}" when expected "audioinput" or "videoinput"`),
)

/**
 * Creates a public-facing {@linkcode EInputDeviceInfo} from a raw
 * {@linkcode InputDeviceInfo} object. Prevents revealing internal fields set by
 * `effect-web-mediacapture-streams` to the end user.
 *
 * @example
 * ```ts
 * import * as EInputDeviceInfo from 'effect-web-mediacapture-streams/EInputDeviceInfo'
 *
 * const rawInputDeviceInfo = (await navigator.mediaDevices.enumerateDevices())
 *   .find(info => info instanceof InputDeviceInfo);
 * const inputDeviceInfoOrError = EInputDeviceInfo.make(rawInputDeviceInfo)
 * ```
 */
export const make = (
  info: InputDeviceInfo,
): Either.Either<EInputDeviceInfo, Brand.Brand.BrandErrors> =>
  Either.all([
    MediaBrand.DeviceId.either(info.deviceId),
    MediaBrand.DeviceGroupId.either(info.groupId),
    MediaBrand.DeviceLabel.either(info.label),
    testKind(info.kind),
  ]).pipe(Either.map(() => makeImpl(info)))

/**
 * Asserts that an `unknown` value is a valid {@linkcode EInputDeviceInfoImpl}
 * and casts it to the type. Throws an error if the assertion fails.
 *
 * @internal
 * @example
 * ```ts
 * const unknownValue: null | EInputDeviceInfo = null
 * try {
 *   const validatedInputDeviceInfo = assertImpl(unknownValue);
 *   // validatedInputDeviceInfo is now known to be EInputDeviceInfoImpl
 * } catch (error) {
 *   console.error("Assertion failed:", error);
 * }
 * ```
 */
const assertImpl = (inputDeviceInfo: unknown) => {
  if (!isImpl(inputDeviceInfo))
    throw new Error('Failed to cast to EInputDeviceInfo')
  return inputDeviceInfo
}

/**
 * Asserts that an `unknown` value is a valid {@linkcode EInputDeviceInfo} and
 * casts it to the type. Throws an error if the assertion fails.
 *
 * @internal
 * @example
 * ```ts
 * import * as EInputDeviceInfo from 'effect-web-mediacapture-streams/EInputDeviceInfo';
 *
 * const unknownValue: null | EInputDeviceInfo.EInputDeviceInfo = null
 *
 * try {
 *   const validatedInputDeviceInfo = EInputDeviceInfo.assert(unknownValue);
 *   // validatedInputDeviceInfo is now known to be EInputDeviceInfo.EInputDeviceInfo
 * } catch (error) {
 *   console.error("Assertion failed:", error);
 * }
 * ```
 *
 * @see {@linkcode is|EInputDeviceInfo.is}
 */
export const assert: (inputDeviceInfo: unknown) => EInputDeviceInfo = assertImpl

/**
 * Purely a type-level typecast to expose internal fields. Does no runtime
 * validation and assumes you provided {@linkcode EInputDeviceInfo} acquired
 * legitimately from `effect-web-mediacapture-streams`.
 *
 * @internal
 * @example
 * ```ts
 * // Assume `inputDeviceInfoInstance` is known to be an internal implementation
 * declare const inputDeviceInfoPublic: EInputDeviceInfo.EInputDeviceInfo;
 * const inputDeviceInfoInternal = assumeImpl(inputDeviceInfoPublic);
 * console.log('No type error here: ', inputDeviceInfoInternal._info)
 * ```
 */
export const assumeImpl = (inputDeviceInfo: EInputDeviceInfo) =>
  inputDeviceInfo as EInputDeviceInfoImpl

/**
 * @internal
 * @example
 * ```ts
 * const inputDeviceInfoOrNot: null | EInputDeviceInfo = null
 *
 * if (isImpl(inputDeviceInfoOrNot)) {
 *   const inputDeviceInfoInternal = inputDeviceInfoOrNot;
 *   // will not be logged
 *   console.log('No type error here: ', inputDeviceInfoInternal._info)
 * } else {
 *   console.log('This will be logged because null is not EInputDeviceInfo')
 * }
 * ```
 */
const isImpl = (
  inputDeviceInfo: unknown,
): inputDeviceInfo is EInputDeviceInfoImpl =>
  typeof inputDeviceInfo === 'object' &&
  inputDeviceInfo !== null &&
  Object.getPrototypeOf(inputDeviceInfo) === Proto &&
  TypeId in inputDeviceInfo &&
  '_info' in inputDeviceInfo &&
  typeof inputDeviceInfo._info === 'object' &&
  inputDeviceInfo._info instanceof InputDeviceInfo &&
  (inputDeviceInfo._info.kind === 'audioinput' ||
    inputDeviceInfo._info.kind === 'videoinput')

/**
 * @example
 * ```ts
 * import * as EInputDeviceInfo from 'effect-web-mediacapture-streams/EInputDeviceInfo';
 *
 * const inputDeviceInfoOrNot: null | EInputDeviceInfo.EInputDeviceInfo = null
 *
 * if (EInputDeviceInfo.is(inputDeviceInfoOrNot)) {
 *   const inputDeviceInfoPublic = inputDeviceInfoOrNot;
 *   // ts-expect-error You're exposed only to public facing fields
 *   console.log(inputDeviceInfoPublic._info)
 *   // will not be logged
 * } else {
 *   console.log('This will be logged because null is not EInputDeviceInfo')
 * }
 * ```
 *
 * @see {@linkcode assert|EInputDeviceInfo.assert}
 */
export const is: (
  inputDeviceInfo: unknown,
) => inputDeviceInfo is EInputDeviceInfo = isImpl

export const getCapabilities = (info: EInputDeviceInfo) =>
  Effect.sync(() => assumeImpl(info)._info.getCapabilities())

// TODO: parse MediaTrackCapabilities to E-prefixed

// TODO: add converter from EMediaDeviceInfo
