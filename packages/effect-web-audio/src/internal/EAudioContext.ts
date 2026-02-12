import type { EMediaDeviceInfo } from 'effect-web-mediacapture-streams/EMediaDeviceInfo'
import type { enumerate } from 'effect-web-mediacapture-streams/EMediaDevices'
export type _1 = EMediaDeviceInfo
export type _2 = typeof enumerate

import type * as MediaBrand from 'effect-web-mediacapture-streams/MediaBrand'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Either from 'effect/Either'
import * as Equal from 'effect/Equal'
import * as EFunction from 'effect/Function'
import * as Hash from 'effect/Hash'
import * as Inspectable from 'effect/Inspectable'
import * as Pipeable from 'effect/Pipeable'

import type * as AudioBrand from './AudioBrand.ts'
import * as AudioErrors from './AudioErrors.ts'
import * as EAudioBuffer from './EAudioBuffer.ts'

/**
 * Unique symbol used for distinguishing
 * {@linkcode EAudioContextInstance|EAudioContext.Instance}s from other objects
 * at both runtime and type-level
 * @internal
 */
const TypeId: unique symbol = Symbol.for(
  'effect-web-audio/EAudioContextInstance',
)

/**
 * Unique symbol used for distinguishing
 * {@linkcode EAudioContextInstance|EAudioContext.Instance}s from other objects
 * at both runtime and type-level
 */
export type TypeId = typeof TypeId

/**
 * A tag that allows to provide
 * {@linkcode EAudioContextInstance|EAudioContext.Instance} once with e.g.
 * {@linkcode layer}, {@linkcode layerDefault}, etc. and reuse
 * it anywhere, instead of repeatedly {@linkcode make}ing it.
 *
 * @example
 * ```ts
 * import * as EAudioContext from 'effect-web-audio/EAudioContext';
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   //  ^ Effect.Effect<
 *   //      void,
 *   //      never,
 *   //      never
 *   //    >
 *
 *   const audioContext = yield* EAudioContext.EAudioContext
 *   //    ^ EAudioContext.Instance
 *
 *   console.log(audioContext.sampleRate)
 *   //                       ^ number
 * }).pipe(Effect.provide(EAudioContext.layerDefault))
 * ```
 *
 * @see `AudioContext` {@link https://www.w3.org/TR/webaudio/#AudioContext|Web Audio spec}, {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioContext|MDN reference}
 */
export class EAudioContext extends Context.Tag(
  'effect-web-audio/EAudioContext',
)<EAudioContext, EAudioContextInstance>() {}

/**
 * Prototype of all objects satisfying the
 * {@linkcode EAudioContextInstance|EAudioContext.Instance} type.
 * @internal
 */
const Proto = {
  _tag: 'EAudioContext' as const,
  [TypeId]: TypeId,
  [Hash.symbol]() {
    return Hash.structure(this._config)
  },
  [Equal.symbol](that: Equal.Equal) {
    return this === that
  },
  pipe() {
    // biome-ignore lint/complexity/noArguments: Effect's tradition
    return Pipeable.pipeArguments(this, arguments)
  },
  toString() {
    return Inspectable.format(this.toJSON())
  },
  toJSON() {
    return { _id: 'EAudioContext', config: this._config }
  },
  [Inspectable.NodeInspectSymbol]() {
    return this.toJSON()
  },

  get sampleRate() {
    return assumeImpl(this)._audioContext.sampleRate
  },

  get baseLatency() {
    return assumeImpl(this)._audioContext.baseLatency
  },
} as EAudioContextImplementationInstance

/**
 * Thin wrapper around raw {@linkcode AudioContext} instance. Will be seen in all the
 * external code. Has a word `Instance` in the name to avoid confusion with
 * {@linkcode EAudioContext|EAudioContext.EAudioContext} context tag.
 */
export interface EAudioContextInstance
  extends Equal.Equal,
    Pipeable.Pipeable,
    Inspectable.Inspectable {
  readonly [TypeId]: TypeId
  readonly _tag: 'EAudioContext'

  readonly baseLatency: number
  readonly sampleRate: number
}

/**
 * Thin wrapper around raw {@linkcode AudioContext} instance giving context to the
 * actual field storing it. Has a word `Instance` in the name to avoid confusion
 * with {@linkcode EAudioContext|EAudioContext.EAudioContext} context tag.
 * @internal
 */
interface EAudioContextImplementationInstance extends EAudioContextInstance {
  readonly _audioContext: AudioContext
  readonly _config: Readonly<MakeAudioContextOptions>
}

/**
 * @param rawAudioContext The raw {@linkcode AudioContext} object from the browser's Web
 * Audio API to be wrapped.
 * @param config Optional configuration options used to acquire the `rawAudioContext`,
 * to preserve alongside it.
 *
 * @returns An object with private fields like
 * {@linkcode EAudioContextImplementationInstance._audioContext|_audioContext} and
 * {@linkcode EAudioContextImplementationInstance._config|_config} that are not
 * supposed to be used externally by user-facing code.
 *
 * @internal
 * @example
 * ```ts
 * const config = {};
 * const rawAudioContext = new AudioContext(config);
 * const internalInstance = makeImpl(rawAudioContext, config);
 * ```
 */
const makeImpl = (
  rawAudioContext: AudioContext,
  config?: Readonly<MakeAudioContextOptions>,
): EAudioContextImplementationInstance => {
  const instance = Object.create(Proto)
  instance._audioContext = rawAudioContext
  instance._config = config ?? {}
  return instance
}

// TODO: update MDN here on AudioContextOptions https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext

/**
 * Creates a public-facing {@linkcode EAudioContextInstance|EAudioContext.Instance}
 * from a raw {@linkcode AudioContext} object and optional configuration options
 * used to acquire it. Prevents revealing internal fields set by
 * `effect-web-audio` to the end user.
 *
 * @example
 * ```ts
 * const config = {  }
 * const instance = make(config);
 * ```
 */
export const make = (
  config?: Readonly<MakeAudioContextOptions>,
): Either.Either<
  EAudioContextInstance,
  | AudioErrors.CannotMakeEAudioContextDocumentIsNotFullyActive
  | AudioErrors.CannotMakeEAudioContextUnsupportedSampleRate
  | AudioErrors.CannotMakeEAudioContextInvalidLatencyHint
> =>
  Either.try({
    try: () => makeImpl(new AudioContext(config), config),
    catch: AudioErrors.remapErrorByName(
      {
        InvalidStateError:
          AudioErrors.CannotMakeEAudioContextDocumentIsNotFullyActive,
        // TODO: also somehow parse NotSupportedError thrown due to reaching maximum allowed number of contexts
        NotSupportedError:
          AudioErrors.CannotMakeEAudioContextUnsupportedSampleRate,
        TypeError: AudioErrors.CannotMakeEAudioContextInvalidLatencyHint,
      },
      'new AudioContext(config) error remapping absurd',
      { config },
    ),
  })

/**
 * Asserts that an `unknown` value is a valid
 * {@linkcode EAudioContextImplementationInstance} and casts it to the type.
 * Throws an error if the assertion fails.
 *
 * @internal
 * @example
 * ```ts
 * const unknownValue: null | EAudioContextInstance = null
 * try {
 *   const validatedAudioContext = assertImpl(unknownValue);
 *   // validatedAudioContext is now known to be EAudioContextImplementationInstance
 * } catch (error) {
 *   console.error("Assertion failed:", error);
 * }
 * ```
 */
const assertImpl = (audioContext: unknown) => {
  if (!isImpl(audioContext)) throw new Error('Failed to cast to EAudioContext')
  return audioContext
}

/**
 * Asserts that an `unknown` value is a valid {@linkcode EAudioContextInstance|EAudioContext.Instance}
 * and casts it to the type. Throws an error if the assertion fails.
 *
 * @internal
 * @example
 * ```ts
 * import * as EAudioContext from 'effect-web-audio/EAudioContext';
 *
 * const unknownValue: null | EAudioContext.Instance = null
 *
 * try {
 *   const validatedAudioContext = EAudioContext.assert(unknownValue);
 *   // validatedAudioContext is now known to be EAudioContext.Instance
 * } catch (error) {
 *   console.error("Assertion failed:", error);
 * }
 * ```
 *
 * @see {@linkcode is|EAudioContext.is}
 */
export const assert: (audioContext: unknown) => EAudioContextInstance =
  assertImpl

/**
 * Purely a type-level typecast to expose internal fields. Does no runtime
 * validation and assumes you provided
 * {@linkcode EAudioContextInstance|EAudioContext.Instance} acquired legitimately
 * from `effect-web-audio`.
 *
 * @internal
 * @example
 * ```ts
 * // Assume `audioContextInstance` is known to be an internal implementation
 * declare const audioContextPublic: EAudioContext.Instance;
 * const audioContextInternal = assumeImpl(audioContextPublic);
 * console.log('No type error here: ', audioContextInternal._config)
 * ```
 */
export const assumeImpl = (audioContext: EAudioContextInstance) =>
  audioContext as EAudioContextImplementationInstance

/**
 * @internal
 * @example
 * ```ts
 * const audioContextOrNot: null | EAudioContextInstance = null
 *
 * if (isImpl(audioContextOrNot)) {
 *   const audioContextInternal = audioContextOrNot;
 *   // will not be logged
 *   console.log('No type error here: ', audioContextInternal._config)
 * } else {
 *   console.log('This will be logged because null is not EAudioContextInstance')
 * }
 * ```
 */
const isImpl = (
  audioContext: unknown,
): audioContext is EAudioContextImplementationInstance =>
  typeof audioContext === 'object' &&
  audioContext !== null &&
  Object.getPrototypeOf(audioContext) === Proto &&
  TypeId in audioContext &&
  '_audioContext' in audioContext &&
  typeof audioContext._audioContext === 'object' &&
  '_config' in audioContext &&
  typeof audioContext._config === 'object' &&
  audioContext._config !== null &&
  audioContext._audioContext instanceof AudioContext

/**
 * @example
 * ```ts
 * import * as EAudioContext from 'effect-web-audio/EAudioContext';
 *
 * const audioContextOrNot: null | EAudioContext.Instance = null
 *
 * if (EAudioContext.is(audioContextOrNot)) {
 *   const audioContextPublic = audioContextOrNot;
 *   // ts-expect-error You're exposed only to public facing fields
 *   console.log(audioContextPublic._config)
 *   // will not be logged
 * } else {
 *   console.log('This will be logged because null is not EAudioContextInstance')
 * }
 * ```
 *
 * @see {@linkcode assert|EAudioContext.assert}
 */
export const is: (
  audioContext: unknown,
) => audioContext is EAudioContextInstance = isImpl

export interface MakeAudioContextOptions extends AudioContextOptions {
  /**
   * The type of playback that the context will be used for, as a predefined
   * string (**`"balanced"`**, **`"interactive"`** or **`"playback"`**) or a
   * double-precision floating-point value indicating the preferred maximum
   * latency of the context in seconds. The user agent may or may not choose to
   * meet this request; check the value of
   * {@linkcode EAudioContextInstance.baseLatency} to determine the true latency
   * after creating the context.

   * - **`"balanced"`**: The browser balances audio output latency and power
   *   consumption when selecting a latency value.
   * - **`"interactive"`** (default value): The audio is involved in interactive
   *   elements, such as responding to user actions or needing to coincide with
   *   visual cues such as a video or game action. The browser selects the
   *   lowest possible latency that doesn't cause glitches in the audio. This is
   *   likely to require increased power consumption.
   * - **`"playback"`**: The browser selects a latency that will maximize
   *   playback time by minimizing power consumption at the expense of latency.
   *   Useful for non-interactive playback, such as playing music.
   */
  readonly latencyHint?: AudioContextLatencyCategory | number

  /**
   * The value must be a floating-point value indicating the sample rate, in
   * samples per second; additionally, the value must be one which is supported
   * by
   * {@linkcode EAudioBuffer.EAudioBuffer.sampleRate|EAudioBuffer.sampleRate}.
   * The value will typically be between 8,000 Hz and 96,000 Hz and the sample
   * rate 44,100 Hz is the most common. If not specified, output device's
   * preferred sample rate will be used by default
   */
  readonly sampleRate?: AudioBrand.SampleRate

  /**
   * Specifies the sink ID of the audio output device to use for the
   * {@linkcode EAudioContext}. This can take one of the following value types:
   *
   * - {@linkcode MediaBrand.AudioSinkId} retrieved for example from the
   *   {@linkcode EMediaDeviceInfo.deviceId|deviceId} of
   *   {@linkcode EMediaDeviceInfo} returned by {@linkcode enumerate}
   * - An object representing different options for a sink ID. Currently, this
   *   takes a single property, type, with a value of none. Setting this
   *   parameter causes the audio to be processed without being played through
   *   any audio output device.
   */
  readonly sinkId?: MediaBrand.AudioSinkId | AudioSinkOptions

  /**
   * Render quantum size is a number of sample-frames in a block. This hint
   * allows users to ask for a specific size, to use the default of 128 frames,
   * or to ask the User-Agent to pick a good size if `"hardware"` is specified.
   * The user agent may or may not choose to meet this request
   */
  readonly renderSizeHint?: AudioContextRenderSizeCategory | number
}

export type AudioContextRenderSizeCategory = 'default' | 'hardware'
export type AudioSinkType = 'none'
export interface AudioSinkOptions {
  readonly type: AudioSinkType
}

export const decodeAudioData: DecodeAudioData = EFunction.dual<
  DecodeAudioDataSourceLast,
  DecodeAudioDataSourceFirst
>(
  args => is(args[0]),
  (context, audioBuffer) =>
    Effect.tryPromise({
      try: () => assumeImpl(context)._audioContext.decodeAudioData(audioBuffer),
      catch: AudioErrors.remapErrorByName(
        {
          InvalidStateError:
            AudioErrors.CannotDecodeAudioDataDocumentIsNotFullyActive,
          DataCloneError: AudioErrors.CannotDecodeAudioDataEmptyBufferError,
          EncodingError:
            AudioErrors.CannotDecodeAudioDataUnrecognizedEncodingFormat,
        },
        'audioContext.decodeAudioData(...) error remapping absurd',
        {},
      ),
    }).pipe(
      Effect.map(EAudioBuffer.makeImpl),
      Effect.withSpan('EAudioContext.decodeAudioData'),
    ),
)

export interface DecodeAudioData
  extends DecodeAudioDataSourceFirst,
    DecodeAudioDataSourceLast {}

// TODO: example in JSDoc
export interface DecodeAudioDataSourceFirst {
  /**
   *
   *
   * @param context
   * @param encodedAudioBuffer
   */
  (
    context: EAudioContextInstance,
    encodedAudioBuffer: ArrayBuffer,
  ): DecodeAudioDataResult
}

// TODO: example in JSDoc
export interface DecodeAudioDataSourceLast {
  /**
   *
   *
   * @param encodedAudioBuffer
   */
  (encodedAudioBuffer: ArrayBuffer): DecodeAudioDataSourceLastSecondPart
}

// TODO: example in JSDoc
export interface DecodeAudioDataSourceLastSecondPart {
  /**
   *
   *
   * @param context
   */
  (context: EAudioContextInstance): DecodeAudioDataResult
}

export type DecodeAudioDataResult = Effect.Effect<
  EAudioBuffer.EAudioBuffer,
  | AudioErrors.CannotDecodeAudioDataDocumentIsNotFullyActive
  | AudioErrors.CannotDecodeAudioDataEmptyBufferError
  | AudioErrors.CannotDecodeAudioDataUnrecognizedEncodingFormat
>

export const currentTime = (context: EAudioContextInstance) =>
  Effect.sync(() => assumeImpl(context)._audioContext.currentTime)
