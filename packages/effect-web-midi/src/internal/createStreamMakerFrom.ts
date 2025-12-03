/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import { dual } from 'effect/Function'
import * as Stream from 'effect/Stream'
import type { EffectfulMIDIAccess } from './EffectfulMIDIAccess.ts'
import type { EffectfulMIDIInputPort } from './EffectfulMIDIInputPort.ts'
import type { EffectfulMIDIOutputPort } from './EffectfulMIDIOutputPort.ts'

// TODO: make stream maker isomorphic

/**
 * Set of possible ways to react when the MIDI-related event will have relevant
 * field be null. Although there should be no sane scenario where it would be
 * the case, it's still allowed by the spec, and for a better UX this lib lets
 * the dev to make a decision on how to handle such cases.
 *
 * - `fail` will add an error into a signature of a stream, allowing the user to
 *   handle it
 * - `die` will throw an defect, which wont be reflected as a possible failure
 *   in types
 * - `ignore` will just silently remove such events from the stream
 * - `passthrough` - will pass such events with an unmodified content of the
 *   relevant field
 *
 * @internal
 */
const validOnNullStrategies = new Set([
  'fail',
  'die',
  'ignore',
  'passthrough',
] as const)

/**
 * Helper utility to turn MIDI event listeners into effect's Streams.
 *
 * The signature is split into 2 calls, so that you are able at first call pass
 * into generic an interface with `addEventListener` types of the raw web MIDI
 * objects as keys and according event structures as values.
 *
 * **Second call arguments**
 *
 * - `isSelf` - Function determining if the maker was called as an overload with
 *   all parameters passed all at once, or with them spread by 2 calls. `self`
 *   will be later assigned to a `cameFrom` property of the object in the
 *   success channel of the stream
 *
 * - `buildConfig` - Function that makes config out of an effectful version
 *   (e.g. {@linkcode EffectfulMIDIAccess}, {@linkcode EffectfulMIDIInputPort},
 *   {@linkcode EffectfulMIDIOutputPort}) of a MIDI object.
 *
 * - `remapValueToContainer` - Callback that maps the value of the event's
 *   selected field to an extension of the object inside streams's success
 *   channel. All fields of the returned object must always be present and
 *   should be consistently nullable, when the incoming event's field is null.
 *
 * @template TEventTypeToEventValueMap An interface with event types of raw
 * Web MIDI objects as keys and according event structures as values. e.g.
 * `MIDIAccessEventMap`, `MIDIPortEventMap`, `MIDIInputEventMap`
 *
 * @internal
 */
export const createStreamMakerFrom =
  <TEventTypeToEventValueMap extends object>() =>
  /**
   * @param isSelf Function determining if the maker was called as an overload
   * with all parameters passed all at once, or with them spread by 2 calls.
   * `self` will be later assigned to a `cameFrom` property of the object in the
   * success channel of the stream
   *
   * @param buildConfig Function that makes config out of an effectful version
   * (e.g. {@linkcode EffectfulMIDIAccess}, {@linkcode EffectfulMIDIInputPort},
   * {@linkcode EffectfulMIDIOutputPort}) of a MIDI object.
   *
   * @param remapValueToContainer Callback that maps the `fieldValue` of the
   * event's selected field (`nullableFieldName`) to an extension of the object
   * inside streams's success channel. The value is not null, except when
   * `onNullStrategy` is `'passthrough'`. All fields of the returned object must
   * always be present and should be consistently nullable, if the incoming
   * event's field is null.
   */
  <
    TEventTarget extends Stream.EventListener<
      TEventTypeToEventValueMap[TSelectedEventType]
    >,
    const TSelectedEventType extends Extract<
      keyof TEventTypeToEventValueMap,
      string
    >,
    const TNullableFieldName extends Extract<
      keyof TEventTypeToEventValueMap[TSelectedEventType],
      string
    >,
    TCameFrom,
    const TTag extends string,
    TContainerWithNullableFields extends object,
  >(
    isSelf: (self: unknown) => self is TCameFrom,
    buildConfig: (
      self: TCameFrom,
    ) => StreamConfig<
      TTag,
      TEventTarget,
      TSelectedEventType,
      TNullableFieldName
    >,
    remapValueToContainer: (
      fieldValue: TEventTypeToEventValueMap[TSelectedEventType][TNullableFieldName],
    ) => TContainerWithNullableFields,
  ): DualStreamMaker<TCameFrom, TTag, TContainerWithNullableFields> =>
    dual(
      args => Effect.isEffect(args[0]) || isSelf(args[0]),
      (cameFrom: TCameFrom, options?: StreamMakerOptions<OnNullStrategy>) => {
        const {
          tag,
          eventListener: { target, type },
          spanAttributes,
          nullableFieldName: field,
        } = buildConfig(cameFrom)

        const onNullStrategy = ((
          options as { onExtremelyRareNullableField?: OnNullStrategy }
        )?.onExtremelyRareNullableField ?? 'die') as Exclude<
          OnNullStrategy,
          undefined
        >

        if (!validOnNullStrategies.has(onNullStrategy))
          throw new Error(
            `Invalid strategy to handle nullish values: ${onNullStrategy}`,
          )

        if (!isSelf(cameFrom))
          throw new TypeError(
            'Stream maker is called with wrong arguments. The type of argument `self` is incorrect',
          )

        const missingFieldMessage = `Property ${field} of ${tag} is null`
        const NullCausedErrorEffect = new Cause.NoSuchElementException(
          missingFieldMessage,
        )

        return Stream.fromEventListener(target, type, options).pipe(
          Stream.filter(event => !!event[field] || onNullStrategy !== 'ignore'),
          Stream.mapEffect(event =>
            event[field] || onNullStrategy === 'passthrough'
              ? Effect.succeed({
                  _tag: tag,
                  ...remapValueToContainer(event[field]),
                  cameFrom,
                  capturedAt: new Date(),
                })
              : onNullStrategy === 'fail'
                ? NullCausedErrorEffect
                : Effect.dieMessage(missingFieldMessage),
          ),
          Stream.withSpan('MIDI Web API event stream', {
            kind: 'producer',
            attributes: { eventType: type, ...spanAttributes },
          }),
        )
      },
    )

const _makeStreamFromWrapped = <
  TCameFrom,
  TTag extends string,
  TContainerWithNullableFields extends object,
>(
  makeStream: DualStreamMaker<TCameFrom, TTag, TContainerWithNullableFields>,
) =>
  dual<
    StreamMakerFromEffectTargetLast<
      TCameFrom,
      TTag,
      TContainerWithNullableFields
    >,
    StreamMakerFromEffectTargetFirst<
      TCameFrom,
      TTag,
      TContainerWithNullableFields
    >
  >(
    args => Effect.isEffect(args[0]),
    (wrappedSelf, options) =>
      wrappedSelf.pipe(Effect.map(makeStream(options)), Stream.unwrap),
  )

export interface StreamConfig<
  TTag,
  TEventTarget,
  TSelectedEventType,
  TNullableFieldName,
> {
  /**
   * Tag that will be assigned to the object inside stream's success channel
   */
  readonly tag: TTag

  /**
   * Config specifying where to attach the event listener
   */
  readonly eventListener: {
    /**
     * Native MIDI object (e.g. {@linkcode MIDIAccess},
     * {@linkcode MIDIInput}, {@linkcode MIDIOutput}) that can have new
     * listeners attached
     */
    readonly target: TEventTarget

    /**
     * The type of event supported by the native MIDI object,
     * `addEventListener`'s first argument (e.g.
     * {@linkcode MIDIAccess.addEventListener|MIDIAccess's},
     * {@linkcode MIDIInput.addEventListener|MIDIInput's},
     * {@linkcode MIDIOutput.addEventListener|MIDIOutput's}) which can have
     * new listeners attached. Restricted by the keys of
     * {@linkcode TEventTypeToEventValueMap} passed in the first call
     */
    readonly type: TSelectedEventType
  }

  /**
   * Additional attributes that will be attached to OpenTelemetry span of
   * the stream
   */
  readonly spanAttributes: {
    readonly spanTargetName: string
    readonly [k: string]: unknown
  }

  /**
   * The name of the field that will be extracted from the event (e.g.
   * {@linkcode MIDIConnectionEvent.port|MIDIConnectionEvent's port},
   * {@linkcode MIDIMessageEvent.data|MIDIMessageEvent's data})
   */
  readonly nullableFieldName: TNullableFieldName
}

export interface StreamMakerOptionsObject<
  TOnNullStrategy extends OnNullStrategy,
> {
  /**
   * A boolean value indicating that events of this type will be dispatched
   * to the registered `listener` before being dispatched to any
   * `EventTarget` beneath it in the DOM tree. If not specified, defaults to
   * `false`.
   */
  readonly capture?: boolean

  /**
   * A boolean value indicating that the `listener` should be invoked at most
   * once after being added. If `true`, the `listener` would be automatically
   * removed when invoked. If not specified, defaults to `false`.
   */
  readonly passive?: boolean

  /**
   * A boolean value that, if true, indicates that the function specified by
   * listener will never call preventDefault(). If a passive listener calls
   * preventDefault(), nothing will happen and a console warning may be
   * generated. If this option is not specified it defaults to false
   */
  readonly once?: boolean

  /**
   * How many elements sent by event target to buffer while waiting for the
   * moment they are consumed. By default it uses an "unbounded" buffer size.
   * Can be limited to a certain number
   */
  readonly bufferSize?: number | 'unbounded' | undefined

  /**
   * A strategy to react when the MIDI-related event will have relevant field be
   * null. Although there should be no sane scenario where it would be the case,
   * it's still allowed by the spec, and for a better DevX this lib lets the dev
   * to make a decision on how to handle such cases.
   *
   * - `fail` will add an error into a signature of a stream, allowing the user
   *   to handle it
   * - `die` will throw a defect, which won't be reflected as a possible failure
   *   in types. Selected by default. `undefined` is treated the same.
   * - `ignore` will just silently remove such events from the stream
   * - `passthrough` - will pass such events with an unmodified content of the
   *   relevant field
   *
   * @default 'die'
   */
  readonly onExtremelyRareNullableField?: TOnNullStrategy
}

/**
 * Passing a boolean is equivalent to setting `options.capture`
 * property
 */
export type StreamMakerOptions<TOnNullStrategy extends OnNullStrategy> =
  | boolean
  | StreamMakerOptionsObject<TOnNullStrategy>
  | undefined

export type OnNullStrategy =
  | (typeof validOnNullStrategies extends Set<infer U> ? U : never)
  | undefined

export type StreamValue<
  TTag extends string,
  TCameFrom,
  TContainerWithNullableFields extends object,
  TOnNullStrategy extends OnNullStrategy,
> = {
  readonly _tag: TTag
  /**
   * An effectful MIDI entity that wraps the raw MIDI object, which triggered an
   * event
   */
  readonly cameFrom: TCameFrom
  readonly capturedAt: Date
} & (
  | {
      readonly [k in keyof TContainerWithNullableFields]: Exclude<
        TContainerWithNullableFields[k],
        null
      >
    }
  | ([TOnNullStrategy] extends ['passthrough']
      ? {
          readonly [k in keyof TContainerWithNullableFields]: null
        }
      : never)
)

export type StreamError<TOnNullStrategy extends OnNullStrategy, TE> =
  | TE
  | ([TOnNullStrategy] extends ['fail'] ? Cause.NoSuchElementException : never)

export interface BuiltStream<
  TTag extends string,
  TCameFrom,
  TContainerWithNullableFields extends object,
  TOnNullStrategy extends OnNullStrategy,
  TE = never,
  TR = never,
> extends Stream.Stream<
    StreamValue<TTag, TCameFrom, TContainerWithNullableFields, TOnNullStrategy>,
    StreamError<TOnNullStrategy, TE>,
    TR
  > {}

export interface DualStreamMaker<
  TCameFrom,
  TTag extends string,
  TContainerWithNullableFields extends object,
> extends StreamMakerTargetFirst<TCameFrom, TTag, TContainerWithNullableFields>,
    StreamMakerTargetLast<TCameFrom, TTag, TContainerWithNullableFields> {}

export interface StreamMakerTargetFirst<
  TCameFrom,
  TTag extends string,
  TContainerWithNullableFields extends object,
> {
  /**
   * @param eventTarget An effectful entity that wraps the raw MIDI object,
   * which triggered an event. Will be assigned to the `cameFrom` property of
   * the stream's success channel object
   *
   * @param options Passing a boolean is equivalent to setting `options.capture`
   * property
   */
  <const TOnNullStrategy extends OnNullStrategy = undefined>(
    eventTarget: TCameFrom,
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): BuiltStream<TTag, TCameFrom, TContainerWithNullableFields, TOnNullStrategy>
}

export interface StreamMakerTargetLast<
  TCameFrom,
  TTag extends string,
  TContainerWithNullableFields extends object,
> {
  /**
   * @param options Passing a boolean is equivalent to setting `options.capture`
   * property
   *
   * **Second call argument**
   *
   * - `eventTarget` An effectful entity that wraps the raw MIDI object,
   *   which triggered an event. Will be assigned to the `cameFrom` property of
   *   the stream's success channel object
   */
  <const TOnNullStrategy extends OnNullStrategy = undefined>(
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): {
    /**
     * @param eventTarget An effectful entity that wraps the raw MIDI
     * object, which triggered an event. Will be assigned to the `cameFrom`
     * property of the stream's success channel object
     */
    (
      eventTarget: TCameFrom,
    ): BuiltStream<
      TTag,
      TCameFrom,
      TContainerWithNullableFields,
      TOnNullStrategy
    >
  }
}

export interface DualStreamMakerFromEffect<
  TCameFrom,
  TTag extends string,
  TContainerWithNullableFields extends object,
> extends StreamMakerFromEffectTargetLast<
      TCameFrom,
      TTag,
      TContainerWithNullableFields
    >,
    StreamMakerFromEffectTargetFirst<
      TCameFrom,
      TTag,
      TContainerWithNullableFields
    > {}

export interface StreamMakerFromEffectTargetLast<
  TCameFrom,
  TTag extends string,
  TContainerWithNullableFields extends object,
> {
  /**
   * @param options Passing a boolean is equivalent to setting `options.capture`
   * property
   *
   * **Second call argument**
   *
   * - `wrappedEventTarget` An effect, that in success channel has entity that
   *   wraps the raw MIDI object, which triggered an event
   */
  <const TOnNullStrategy extends OnNullStrategy = undefined>(
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): {
    /**
     * @param wrappedEventTarget An effect, that in success channel has entity
     * that wraps the raw MIDI object, which triggered an event
     */
    <E, R>(
      wrappedEventTarget: Effect.Effect<TCameFrom, E, R>,
    ): BuiltStream<
      TTag,
      TCameFrom,
      TContainerWithNullableFields,
      TOnNullStrategy,
      E,
      R
    >
  }
}

export interface StreamMakerFromEffectTargetFirst<
  TCameFrom,
  TTag extends string,
  TContainerWithNullableFields extends object,
> {
  /**
   * @param wrappedEventTarget An effect, that in success channel has entity
   * that wraps the raw MIDI object, which triggered an event
   *
   * @param options Passing a boolean is equivalent to setting `options.capture`
   * property
   */
  <E, R, const TOnNullStrategy extends OnNullStrategy = undefined>(
    wrappedEventTarget: Effect.Effect<TCameFrom, E, R>,
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): BuiltStream<
    TTag,
    TCameFrom,
    TContainerWithNullableFields,
    TOnNullStrategy,
    E,
    R
  >
}
