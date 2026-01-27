import * as Either from 'effect/Either'
import * as Equal from 'effect/Equal'
import { dual } from 'effect/Function'
import * as Hash from 'effect/Hash'
import * as Inspectable from 'effect/Inspectable'
import * as Pipeable from 'effect/Pipeable'

import * as AudioBrand from './AudioBrand.ts'
import * as AudioErrors from './AudioErrors.ts'

// TODO: fuzzing property-based testing all of the arrays to catch more errors

/**
 * Unique symbol used for distinguishing
 * {@linkcode EAudioBuffer}s from other objects
 * at both runtime and type-level
 * @internal
 */
const TypeId: unique symbol = Symbol.for('effect-web-audio/EAudioBuffer')

/**
 * Unique symbol used for distinguishing
 * {@linkcode EAudioBuffer}s from other objects
 * at both runtime and type-level
 */
export type TypeId = typeof TypeId

/**
 * Prototype of all objects satisfying the
 * {@linkcode EAudioBuffer} type.
 * @internal
 */
const Proto = {
  _tag: 'EAudioBuffer' as const,
  [TypeId]: TypeId,
  [Hash.symbol](this: EAudioBufferImpl) {
    return Hash.random(assumeImpl(this)._audioBuffer)
  },
  [Equal.symbol](that: Equal.Equal) {
    return (
      typeof that === 'object' &&
      that !== null &&
      'sampleRate' in that &&
      'length' in that &&
      'numberOfChannels' in that &&
      this.sampleRate === that?.sampleRate &&
      this.length === that.length &&
      this.numberOfChannels === that.numberOfChannels
    )
  },
  pipe() {
    // biome-ignore lint/complexity/noArguments: Effect's tradition
    return Pipeable.pipeArguments(this, arguments)
  },
  toString() {
    return `EAudioBuffer(${this.numberOfChannels}ch, ${this.length} samples, ${this.sampleRate}Hz, ${this.duration.toFixed(2)}s)`
  },
  toJSON() {
    return {
      _id: 'EAudioBuffer',
      sampleRate: this.sampleRate,
      length: this.length,
      channelsData: Array.from(
        { length: this.numberOfChannels },
        (_, channelIndex) => {
          const tempArray = new Float32Array(this.length)
          copyFromChannel(
            this,
            tempArray,
            AudioBrand.ChannelIndex(channelIndex),
          )
          return [...tempArray]
        },
      ),
    }
  },
  [Inspectable.NodeInspectSymbol](
    depth: number,
    options: any,
    inspect: (...args: any[]) => any,
  ) {
    if (depth < 0) return options.stylize('[EAudioBuffer]', 'special')

    return inspect(
      {
        _id: 'EAudioBuffer',
        sampleRate: this.sampleRate,
        length: this.length,
        channelsData: Array.from(
          { length: this.numberOfChannels },
          (_, channelIndex) => {
            var tempArray = new Float32Array(this.length)
            copyFromChannel(
              this,
              tempArray,
              AudioBrand.ChannelIndex(channelIndex),
            )
            return tempArray
          },
        ),
      },
      {
        ...(options || {}),
        depth: options.depth === null ? null : options.depth - 1,
      },
    )
  },

  get sampleRate() {
    return assumeImpl(this)._audioBuffer.sampleRate as AudioBrand.SampleRate
  },

  get length() {
    return assumeImpl(this)._audioBuffer.length as AudioBrand.SampleFrameAmount
  },

  get duration() {
    return assumeImpl(this)._audioBuffer.duration as AudioBrand.PositiveSeconds
  },

  get numberOfChannels() {
    return assumeImpl(this)._audioBuffer
      .numberOfChannels as AudioBrand.ChannelAmount
  },
} as EAudioBufferImpl

/**
 * Thin wrapper around raw {@linkcode AudioBuffer} instance. Will be seen in all the
 * external code. Has a word `Instance` in the name to avoid confusion with
 * {@linkcode EAudioBuffer|EAudioBuffer.EAudioBuffer} buffer tag.
 */
export interface EAudioBuffer
  extends Equal.Equal,
    Pipeable.Pipeable,
    Inspectable.Inspectable {
  readonly [TypeId]: TypeId
  readonly _tag: 'EAudioBuffer'

  /**
   * The sample-rate for the PCM audio data in samples per second. Is a value of
   * type `float`.
   */
  readonly sampleRate: AudioBrand.SampleRate

  /**
   * Length of the PCM audio data in sample-frames. Is a value of type `unsigned long`.
   */
  readonly length: AudioBrand.SampleFrameAmount

  /**
   * Duration of the PCM audio data in seconds. Calculated as
   * {@linkcode EAudioBuffer.length} divided by
   * {@linkcode EAudioBuffer.sampleRate}. Is a value of
   * type `double`.
   */
  readonly duration: AudioBrand.PositiveSeconds

  /**
   * The number of discrete audio channels. Is a value of type `unsigned long`.
   */
  readonly numberOfChannels: AudioBrand.ChannelAmount
}

/**
 * Thin wrapper around raw {@linkcode AudioBuffer} instance giving buffer to the
 * actual field storing it. Has a word `Instance` in the name to avoid confusion
 * with {@linkcode EAudioBuffer|EAudioBuffer.EAudioBuffer} buffer tag.
 * @internal
 */
interface EAudioBufferImpl extends EAudioBuffer {
  readonly _audioBuffer: AudioBuffer
}

/**
 * @param rawAudioBuffer The raw {@linkcode AudioBuffer} object from the browser's Web
 * Audio API to be wrapped.
 *
 * @internal
 * @example
 * ```ts
 * const rawAudioBuffer = new AudioBuffer({
 *   length: 120,
 *   sampleRate: 44100,
 *   numberOfChannels: 2,
 * });
 * const internalInstance = makeImpl(rawAudioBuffer);
 * ```
 */
export const makeImpl = (rawAudioBuffer: AudioBuffer): EAudioBufferImpl => {
  const instance = Object.create(Proto)
  instance._audioBuffer = rawAudioBuffer
  return instance
}

// TODO: wrap all returned either into Effect.suspend to ensure delayed
// processing of side-effectful operations
// Example: we can create a buffer, and it's allocation is a side-effectful
// operation; same inputs will not correspond to the same outputs, because
// allocation of big chunks of memory can fail. It's not like 1+1, which will
// almost never fail.

// TODO: update MDN here on AudioBufferOptions https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer/AudioBuffer

/**
 * Creates a public-facing {@linkcode EAudioBuffer}
 * from a raw {@linkcode AudioBuffer} object and optional configuration options
 * used to acquire it. Prevents revealing internal fields set by
 * `effect-web-audio` to the end user.
 *
 * @example
 * ```ts
 * import * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
 * import * as AudioBrand from 'effect-web-audio/AudioBrand'
 *
 * const audioBufferOrError = EAudioBuffer.make({
 *   length: AudioBrand.SampleFrameAmount(120),
 *   sampleRate: AudioBrand.SampleRate(44100),
 *   numberOfChannels: AudioBrand.ChannelAmount(2),
 * })
 * ```
 */
export const make = (
  config: MakeAudioBufferOptions,
): Either.Either<
  EAudioBuffer,
  | AudioErrors.CannotMakeEAudioBufferInvalidOptions
  | AudioErrors.CannotMakeEAudioBufferNotEnoughMemory
> =>
  Either.try({
    try: () => makeImpl(new AudioBuffer(config)),
    catch: AudioErrors.remapErrorByName(
      {
        NotSupportedError: AudioErrors.CannotMakeEAudioBufferInvalidOptions,
        RangeError: AudioErrors.CannotMakeEAudioBufferNotEnoughMemory,
      },
      'new AudioBuffer(config) error remapping absurd',
      { config },
    ),
  })

/**
 * Asserts that an `unknown` value is a valid
 * {@linkcode EAudioBufferImpl} and casts it to the type.
 * Throws an error if the assertion fails.
 *
 * @internal
 * @example
 * ```ts
 * const unknownValue: null | EAudioBuffer = null
 * try {
 *   const validatedAudioBuffer = assertImpl(unknownValue);
 *   // validatedAudioBuffer is now known to be EAudioBufferImpl
 * } catch (error) {
 *   console.error("Assertion failed:", error);
 * }
 * ```
 */
const assertImpl = (audioBuffer: unknown) => {
  if (!isImpl(audioBuffer)) throw new Error('Failed to cast to EAudioBuffer')
  return audioBuffer
}

/**
 * Asserts that an `unknown` value is a valid {@linkcode EAudioBuffer}
 * and casts it to the type. Throws an error if the assertion fails.
 *
 * @internal
 * @example
 * ```ts
 * import * as EAudioBuffer from 'effect-web-audio/EAudioBuffer';
 *
 * const unknownValue: null | EAudioBuffer.EAudioBuffer = null
 *
 * try {
 *   const validatedAudioBuffer = EAudioBuffer.assert(unknownValue);
 *   // validatedAudioBuffer is now known to be EAudioBuffer.EAudioBuffer
 * } catch (error) {
 *   console.error("Assertion failed:", error);
 * }
 * ```
 *
 * @see {@linkcode is|EAudioBuffer.is}
 */
export const assert: (audioBuffer: unknown) => EAudioBuffer = assertImpl

/**
 * Purely a type-level typecast to expose internal fields. Does no runtime
 * validation and assumes you provided
 * {@linkcode EAudioBuffer} acquired legitimately
 * from `effect-web-audio`.
 *
 * @internal
 * @example
 * ```ts
 * // Assume `audioBufferInstance` is known to be an internal implementation
 * declare const audioBufferPublic: EAudioBuffer.EAudioBuffer;
 * const audioBufferInternal = assumeImpl(audioBufferPublic);
 * console.log('No type error here: ', audioBufferInternal._audioBuffer)
 * ```
 */
export const assumeImpl = (audioBuffer: EAudioBuffer) =>
  audioBuffer as EAudioBufferImpl

/**
 * @internal
 * @example
 * ```ts
 * const audioBufferOrNot: null | EAudioBuffer = null
 *
 * if (isImpl(audioBufferOrNot)) {
 *   const audioBufferInternal = audioBufferOrNot;
 *   // will not be logged
 *   console.log('No type error here: ', audioBufferInternal._audioBuffer)
 * } else {
 *   console.log('This will be logged because null is not EAudioBuffer')
 * }
 * ```
 */
const isImpl = (audioBuffer: unknown): audioBuffer is EAudioBufferImpl =>
  typeof audioBuffer === 'object' &&
  audioBuffer !== null &&
  Object.getPrototypeOf(audioBuffer) === Proto &&
  TypeId in audioBuffer &&
  '_audioBuffer' in audioBuffer &&
  typeof audioBuffer._audioBuffer === 'object' &&
  audioBuffer._audioBuffer instanceof AudioBuffer

/**
 * @example
 * ```ts
 * import * as EAudioBuffer from 'effect-web-audio/EAudioBuffer';
 *
 * const audioBufferOrNot: null | EAudioBuffer.EAudioBuffer = null
 *
 * if (EAudioBuffer.is(audioBufferOrNot)) {
 *   const audioBufferPublic = audioBufferOrNot;
 *   // ts-expect-error You're exposed only to public facing fields
 *   console.log(audioBufferPublic._audioBuffer)
 *   // will not be logged
 * } else {
 *   console.log('This will be logged because null is not EAudioBuffer')
 * }
 * ```
 *
 * @see {@linkcode assert|EAudioBuffer.assert}
 */
export const is: (audioBuffer: unknown) => audioBuffer is EAudioBuffer = isImpl

export interface MakeAudioBufferOptions extends AudioBufferOptions {
  /**
   * The value must be a floating-point value indicating the sample rate, in
   * samples per second, for which to configure the new buffer; additionally,
   * the value must be one which is supported by AudioBuffer.sampleRate. The
   * value will typically be between 8,000 Hz and 96,000 Hz; the default will
   * vary depending on the output device, but the sample rate 44,100 Hz is the
   * most common. If the sampleRate property is not included in the options, or
   * the options are not specified when creating the audio buffer, the new
   * buffer's output device's preferred sample rate is used by default.
   */
  readonly sampleRate: AudioBrand.SampleRate

  /**
   * The size of the audio buffer in sample-frames. To determine the length to
   * use for a specific number of seconds of audio, use numSeconds * sampleRate.
   */
  readonly length: AudioBrand.SampleFrameAmount

  /**
   * The number of channels for the buffer. All user agents are required to
   * support at least 32 channels
   * @default 1
   */
  readonly numberOfChannels?: AudioBrand.ChannelAmount
}

const bufferSummary = ({
  byteOffset,
  byteLength,
  BYTES_PER_ELEMENT,
}: {
  byteOffset: number
  byteLength: number
  BYTES_PER_ELEMENT: number
}) => ({
  byteOffset,
  byteLength,
  bytesPerElement: BYTES_PER_ELEMENT,
})

export const copyFromChannel: CopyFromChannel = dual<
  CopyFromChannelSourceLast,
  CopyFromChannelSourceFirst
>(
  args => is(args[0]),
  (source, destination, channelIndex, bufferOffset) =>
    Either.try({
      try: () =>
        assumeImpl(source)._audioBuffer.copyFromChannel(
          destination,
          channelIndex,
          bufferOffset,
        ),
      catch: AudioErrors.remapErrorByName(
        {
          IndexSizeError:
            AudioErrors.CannotCopyFromChannelOfEAudioBufferWrongChannelIndex,
        },
        'audioBuffer.copyFromChannel(...) error remapping absurd',
        {
          bufferOffset,
          channelIndex,
          destinationFloatArraySummary: bufferSummary(destination),
        },
      ),
    }),
)

export interface CopyFromChannel
  extends CopyFromChannelSourceFirst,
    CopyFromChannelSourceLast {}

// TODO: example in JSDoc
export interface CopyFromChannelSourceFirst {
  /**
   * Copy the samples.
   *
   * @param source A buffer with an existing channel, that the data will be
   * copied from.
   * @param destination The array the channel data will be copied to.
   * @param channelIndex The index of the channel to copy the data from. When
   * `channelIndex`>=
   * {@linkcode EAudioBuffer.numberOfChannels|source.numberOfChannels}, returns
   * an error.
   * @param bufferOffset An optional offset, defaulting to `0`. Data from the
   * {@linkcode EAudioBuffer} starting at this offset is copied to the
   * destination.
   */
  (
    source: EAudioBuffer,
    destination: Float32Array<ArrayBuffer>,
    channelIndex: AudioBrand.ChannelIndex,
    bufferOffset?: number | undefined,
  ): CopyFromChannelResult
}

// TODO: example in JSDoc
export interface CopyFromChannelSourceLast {
  /**
   * Prepare to copy the samples.
   *
   * @param destination The array the channel data will be copied to.
   * @param channelIndex The index of the channel to copy the data from. When
   * `channelIndex`>=
   * {@linkcode EAudioBuffer.numberOfChannels|source.numberOfChannels}, returns
   * an error.
   * @param bufferOffset An optional offset, defaulting to `0`. Data from the
   * {@linkcode EAudioBuffer} starting at this offset is copied to the
   * destination.
   */
  (
    destination: Float32Array<ArrayBuffer>,
    channelIndex: AudioBrand.ChannelIndex,
    bufferOffset?: number | undefined,
  ): CopyFromChannelSourceLastSecondPart
}

// TODO: example in JSDoc
export interface CopyFromChannelSourceLastSecondPart {
  /**
   * Copy the samples.
   *
   * @param source A buffer with an existing channel, that the data will be
   * copied from.
   */
  (source: EAudioBuffer): CopyFromChannelResult
}

export type CopyFromChannelResult = Either.Either<
  void,
  AudioErrors.CannotCopyFromChannelOfEAudioBufferWrongChannelIndex
>

export const copyToChannel: CopyToChannel = dual<
  CopyToChannelDestinationLast,
  CopyToChannelDestinationFirst
>(
  args => is(args[0]),
  (destination, source, channelIndex, bufferOffset) =>
    Either.try({
      try: () =>
        assumeImpl(destination)._audioBuffer.copyToChannel(
          source,
          channelIndex,
          bufferOffset,
        ),
      catch: AudioErrors.remapErrorByName(
        {
          IndexSizeError:
            AudioErrors.CannotCopyToChannelOfEAudioBufferWrongChannelIndex,
          UnknownError:
            AudioErrors.CannotCopyToChannelOfEAudioBufferUnknownError,
        },
        'audioBuffer.copyToChannel(...) error remapping absurd',
        {
          bufferOffset,
          channelIndex,
          sourceFloatArraySummary: bufferSummary(source),
        },
      ),
    }),
)

export interface CopyToChannel
  extends CopyToChannelDestinationFirst,
    CopyToChannelDestinationLast {}

export type CopyToChannelResult = Either.Either<
  void,
  | AudioErrors.CannotCopyToChannelOfEAudioBufferWrongChannelIndex
  | AudioErrors.CannotCopyToChannelOfEAudioBufferUnknownError
>

// TODO: example in JSDoc
export interface CopyToChannelDestinationFirst {
  /**
   * Copy the samples.
   *
   * @param destination A buffer with an existing channel, that the data will be
   * copied to.
   * @param source The array the channel data will be copied from.
   * @param channelIndex The index of the channel to copy the data to. When
   * `channelIndex`>=
   * {@linkcode EAudioBuffer.numberOfChannels|destination.numberOfChannels},
   * returns an error.
   * @param bufferOffset An optional offset, defaulting to `0`. Data from the
   * source is copied to the {@linkcode EAudioBuffer} starting at this offset.
   */
  (
    destination: EAudioBuffer,
    source: Float32Array<ArrayBuffer>,
    channelIndex: AudioBrand.ChannelIndex,
    bufferOffset?: number | undefined,
  ): CopyToChannelResult
}

// TODO: example in JSDoc
export interface CopyToChannelDestinationLast {
  /**
   * Prepare to copy the samples.
   *
   * @param source The array the channel data will be copied from.
   * @param channelIndex The index of the channel to copy the data to. When
   * `channelIndex`>=
   * {@linkcode EAudioBuffer.numberOfChannels|destination.numberOfChannels},
   * returns an error.
   * @param bufferOffset An optional offset, defaulting to `0`. Data from the
   * source is copied to the {@linkcode EAudioBuffer} starting at this offset.
   */
  (
    source: Float32Array<ArrayBuffer>,
    channelIndex: AudioBrand.ChannelIndex,
    bufferOffset?: number | undefined,
  ): CopyToChannelDestinationLastSecondPart
}

// TODO: example in JSDoc
export interface CopyToChannelDestinationLastSecondPart {
  /**
   * Copy the samples.
   *
   * @param destination A buffer with an existing channel, that the data will be
   * copied to.
   */
  (destination: EAudioBuffer): CopyToChannelResult
}

// TODO: maybe open an issue in the spec about https://www.w3.org/TR/webaudio/#dom-audiobuffer-copyfromchannel not saying anything about UnknownError
export const getChannelData: GetChannelData = dual<
  GetChannelDataSourceLast,
  GetChannelDataSourceFirst
>(
  args => is(args[0]),
  (source, channelIndex) =>
    Either.try({
      try: () => assumeImpl(source)._audioBuffer.getChannelData(channelIndex),
      catch: AudioErrors.remapErrorByName(
        {
          IndexSizeError:
            AudioErrors.CannotChannelDataOfEAudioBufferWrongChannelIndex,
          UnknownError: AudioErrors.CannotChannelDataOfEAudioBufferUnknownError,
        },
        'audioBuffer.getChannelData(...) error remapping absurd',
        { channelIndex },
      ),
    }),
)

export interface GetChannelData
  extends GetChannelDataSourceFirst,
    GetChannelDataSourceLast {}

// TODO: example in JSDoc
export interface GetChannelDataSourceFirst {
  /**
   * Copy the samples.
   *
   * @param source A buffer with an existing channel, that the data will be
   * copied from.
   * @param channelIndex The index of the channel to copy the data from. When
   * `channelIndex`>=
   * {@linkcode EAudioBuffer.numberOfChannels|source.numberOfChannels}, returns
   * an error.
   */
  (
    source: EAudioBuffer,
    channelIndex: AudioBrand.ChannelIndex,
  ): GetChannelDataResult
}

// TODO: example in JSDoc
export interface GetChannelDataSourceLast {
  /**
   * Prepare to copy the samples.
   *
   * @param channelIndex The index of the channel to copy the data from. When
   * `channelIndex`>=
   * {@linkcode EAudioBuffer.numberOfChannels|source.numberOfChannels}, returns
   * an error.
   */
  (channelIndex: AudioBrand.ChannelIndex): GetChannelDataSourceLastSecondPart
}

// TODO: example in JSDoc
export interface GetChannelDataSourceLastSecondPart {
  /**
   * Copy the samples.
   *
   * @param source A buffer with an existing channel, that the data will be
   * copied from.
   */
  (source: EAudioBuffer): GetChannelDataResult
}

export type GetChannelDataResult = Either.Either<
  Float32Array,
  | AudioErrors.CannotChannelDataOfEAudioBufferWrongChannelIndex
  | AudioErrors.CannotChannelDataOfEAudioBufferUnknownError
>
