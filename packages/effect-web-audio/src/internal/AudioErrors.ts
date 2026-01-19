import * as EFunction from 'effect/Function'
import * as Schema from 'effect/Schema'
import type * as Types from 'effect/Types'

// TODO: deduplicate with effect-web-midi
const ErrorSchema = <TSchema extends Schema.Schema.Any | undefined = undefined>(
  nameSchema?: TSchema,
) =>
  Schema.Struct({
    name: (nameSchema ??
      Schema.NonEmptyTrimmedString) as TSchema extends undefined
      ? typeof Schema.NonEmptyTrimmedString
      : TSchema,
    message: Schema.NonEmptyTrimmedString,
    stack: Schema.NonEmptyTrimmedString.pipe(
      Schema.optionalWith({ exact: true }),
    ),
    cause: Schema.Unknown.pipe(Schema.optionalWith({ exact: true })),
  })

// TODO: deduplicate with effect-web-midi
// TODO: Make so that the function also ensures that cause.name is properly matches the field it's assigned from, so that consistency goes both ways
/**
 *
 * @internal
 */
export const remapErrorByName =
  <TErrorClassUnion extends new (arg: any) => Error>(
    map: { [name: string]: TErrorClassUnion },
    absurdMessage: string,
    rest: Omit<
      Types.UnionToIntersection<
        TErrorClassUnion extends new (arg: infer P) => any ? P : never
      >,
      'cause'
    >,
  ) =>
  (cause: unknown) => {
    if (!(cause instanceof Error && cause.name in map))
      throw new Error(absurdMessage)
    // biome-ignore lint/style/noNonNullAssertion: Because we checked it above with `cause.name in map`
    const Class = map[cause.name]!
    return new Class({
      cause,
      ...rest,
    }) as InstanceType<TErrorClassUnion>
  }

const config = Schema.UndefinedOr(
  Schema.Struct({
    latencyHint: Schema.Union(
      Schema.Literal('balanced', 'interactive', 'playback'),
      Schema.Number,
    ).pipe(Schema.optionalWith({ exact: true })),
    sampleRate: Schema.Number.pipe(Schema.optionalWith({ exact: true })),
    sinkId: Schema.Union(
      Schema.String,
      Schema.Struct({
        type: Schema.Literal('none'),
      }),
    ).pipe(Schema.optionalWith({ exact: true })),
    renderSizeHint: EFunction.pipe(
      Schema.Union(Schema.Literal('hardware', 'default'), Schema.Number),
      Schema.optionalWith({ exact: true }),
    ),
  }),
)

//? CannotMakeEAudioContext

// TODO: fix MDN docs on AudioContext Exceptions
/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext#exceptions|MDN AudioContext Exceptions}
 */
export class CannotMakeEAudioContextDocumentIsNotFullyActive extends Schema.TaggedError<CannotMakeEAudioContextDocumentIsNotFullyActive>()(
  'CannotMakeEAudioContextDocumentIsNotFullyActive',
  { cause: ErrorSchema(Schema.Literal('InvalidStateError')), config },
) {}

/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext#exceptions|MDN AudioContext Exceptions}
 */
export class CannotMakeEAudioContextUnsupportedSampleRate extends Schema.TaggedError<CannotMakeEAudioContextUnsupportedSampleRate>()(
  'CannotMakeEAudioContextUnsupportedSampleRate',
  { cause: ErrorSchema(Schema.Literal('NotSupportedError')), config },
) {}

/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext#exceptions|MDN AudioContext Exceptions}
 */
export class CannotMakeEAudioContextInvalidLatencyHint extends Schema.TaggedError<CannotMakeEAudioContextInvalidLatencyHint>()(
  'CannotMakeEAudioContextInvalidLatencyHint',
  { cause: ErrorSchema(Schema.Literal('TypeError')), config },
) {}

//? CannotMakeEAudioBuffer

/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer/AudioBuffer#exceptions|MDN AudioBuffer Exceptions}
 */
export class CannotMakeEAudioBufferInvalidOptions extends Schema.TaggedError<CannotMakeEAudioBufferInvalidOptions>()(
  'CannotMakeEAudioBufferInvalidOptions',
  {
    cause: ErrorSchema(Schema.Literal('NotSupportedError')),
    config: Schema.Unknown,
  },
) {}

/**
 * I'm not sure if this error will actually be thrown, since the spec doesn't say it would. But MDN for some reason says it would.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer/AudioBuffer#exceptions|MDN AudioBuffer Exceptions}
 */
export class CannotMakeEAudioBufferNotEnoughMemory extends Schema.TaggedError<CannotMakeEAudioBufferNotEnoughMemory>()(
  'CannotMakeEAudioBufferNotEnoughMemory',
  { cause: ErrorSchema(Schema.Literal('RangeError')), config: Schema.Unknown },
) {}

const FloatArraySummarySchema = Schema.Struct({
  byteOffset: Schema.Number,
  byteLength: Schema.Number,
  bytesPerElement: Schema.Number,
})

const copyFromToChannelContext = <const T extends string>(str: T) => ({
  ...({ [str + 'FloatArraySummary']: FloatArraySummarySchema } as Record<
    `${T}FloatArraySummary`,
    typeof FloatArraySummarySchema
  >),
  channelIndex: Schema.Number,
  bufferOffset: Schema.UndefinedOr(Schema.Number),
})

//? CannotCopy From ChannelOfEAudioBuffer

export class CannotCopyFromChannelOfEAudioBufferWrongChannelIndex extends Schema.TaggedError<CannotCopyFromChannelOfEAudioBufferWrongChannelIndex>()(
  'CannotCopyFromChannelOfEAudioBufferWrongChannelIndex',
  {
    cause: ErrorSchema(Schema.Literal('IndexSizeError')),
    ...copyFromToChannelContext('destination'),
  },
) {}

//? CannotCopy To ChannelOfEAudioBuffer

export class CannotCopyToChannelOfEAudioBufferWrongChannelIndex extends Schema.TaggedError<CannotCopyToChannelOfEAudioBufferWrongChannelIndex>()(
  'CannotCopyToChannelOfEAudioBufferWrongChannelIndex',
  {
    cause: ErrorSchema(Schema.Literal('IndexSizeError')),
    ...copyFromToChannelContext('source'),
  },
) {}

/**
 * Can be thrown for example in the case of insufficient memory
 */
export class CannotCopyToChannelOfEAudioBufferUnknownError extends Schema.TaggedError<CannotCopyToChannelOfEAudioBufferUnknownError>()(
  'CannotCopyToChannelOfEAudioBufferUnknownError',
  {
    cause: ErrorSchema(Schema.Literal('UnknownError')),
    ...copyFromToChannelContext('source'),
  },
) {}

//? CannotChannelDataOfEAudioBuffer

export class CannotChannelDataOfEAudioBufferWrongChannelIndex extends Schema.TaggedError<CannotChannelDataOfEAudioBufferWrongChannelIndex>()(
  'CannotChannelDataOfEAudioBufferWrongChannelIndex',
  {
    cause: ErrorSchema(Schema.Literal('IndexSizeError')),
    channelIndex: Schema.Number,
  },
) {}

/**
 * Can be thrown for example in the case of insufficient memory
 */
export class CannotChannelDataOfEAudioBufferUnknownError extends Schema.TaggedError<CannotChannelDataOfEAudioBufferUnknownError>()(
  'CannotCopyToChannelOfEAudioBufferUnknownError',
  {
    cause: ErrorSchema(Schema.Literal('UnknownError')),
    channelIndex: Schema.Number,
  },
) {}

//? decodeAudioData

export class CannotDecodeAudioDataDocumentIsNotFullyActive extends Schema.TaggedError<CannotDecodeAudioDataDocumentIsNotFullyActive>()(
  'CannotDecodeAudioDataDocumentIsNotFullyActive',
  { cause: ErrorSchema(Schema.Literal('InvalidStateError')) },
) {}

// When fails to clone into separate decoding thread, for example, but also needs to be tested if OOM can trigger it
export class CannotDecodeAudioDataEmptyBufferError extends Schema.TaggedError<CannotDecodeAudioDataEmptyBufferError>()(
  'CannotDecodeAudioDataEmptyBufferError',
  { cause: ErrorSchema(Schema.Literal('DataCloneError')) },
) {}

export class CannotDecodeAudioDataUnrecognizedEncodingFormat extends Schema.TaggedError<CannotDecodeAudioDataUnrecognizedEncodingFormat>()(
  'CannotDecodeAudioDataUnrecognizedEncodingFormat',
  { cause: ErrorSchema(Schema.Literal('EncodingError')) },
) {}
