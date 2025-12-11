/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import { dual } from 'effect/Function'
import * as Stream from 'effect/Stream'
import type { EffectfulMIDIAccessInstance } from './EffectfulMIDIAccess.ts'
import type { EffectfulMIDIInputPort } from './EffectfulMIDIInputPort.ts'
import type { EffectfulMIDIOutputPort } from './EffectfulMIDIOutputPort.ts'
import {
  fromPolymorphic,
  type PolymorphicEffect,
  polymorphicCheckInDual,
} from './util.ts'

// TODO: make an experiment to see if listeners are automatically removed on disconnect

/**
 * Set of possible ways to react when the MIDI-related event will have relevant
 * field be null. Although there should be no sane scenario where it would be
 * the case, it's still allowed by the spec, and for a better UX this lib lets
 * the developer make a decision on how to handle such cases.
 *
 * - `fail` will add an error into a signature of a stream, allowing the user to
 *   handle it
 * - `die` will throw a defect, which won't be reflected as a possible failure
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
 *   (e.g. {@linkcode EffectfulMIDIAccessInstance}, {@linkcode EffectfulMIDIInputPort},
 *   {@linkcode EffectfulMIDIOutputPort}) of a MIDI object.
 *
 * - `remapValueToContainer` - Callback that maps the value of the event's
 *   selected field to an extension of the object inside stream's success
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
   * (e.g. {@linkcode EffectfulMIDIAccessInstance}, {@linkcode EffectfulMIDIInputPort},
   * {@linkcode EffectfulMIDIOutputPort}) of a MIDI object.
   *
   * @param remapValueToContainer Callback that maps the `fieldValue` of the
   * event's selected field (`nullableFieldName`) to an extension of the object
   * inside stream's success channel. The value is not null, except when
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
    dual<
      MakeStreamTargetLast<TCameFrom, TTag, TContainerWithNullableFields>,
      MakeStreamTargetFirst<TCameFrom, TTag, TContainerWithNullableFields>
    >(
      polymorphicCheckInDual(isSelf),
      (cameFromPolymorphic, options) =>
        Effect.gen(function* () {
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

          const cameFrom = yield* fromPolymorphic(cameFromPolymorphic, isSelf)

          const {
            tag,
            eventListener: { target, type },
            spanAttributes,
            nullableFieldName: field,
          } = buildConfig(cameFrom)

          const missingFieldMessage = `Property ${field} of ${tag} is null`
          const NullCausedErrorEffect = new Cause.NoSuchElementException(
            missingFieldMessage,
          )

          return Stream.fromEventListener(target, type, options).pipe(
            Stream.filter(
              event => !!event[field] || onNullStrategy !== 'ignore',
            ),
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
          // biome-ignore lint/suspicious/noExplicitAny: <I don't care>
        }).pipe(Stream.unwrap) as any,
    )

interface StreamConfig<
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
   * Additional attributes that will be attached to Open Telemetry span of
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

export interface StreamMakerOptionsWellknown {
  /**
   * A boolean value indicating that events of this type will be dispatched to
   * the registered `listener` before being dispatched to any `EventTarget`
   * beneath it in the DOM tree.
   * @default false
   */
  readonly capture?: boolean

  /**
   * A boolean value indicating that the `listener` should be invoked at most
   * once after being added. If `true`, the `listener` would be automatically
   * removed when invoked.
   * @default false
   */
  readonly passive?: boolean

  /**
   * A boolean value that, if true, indicates that the function specified by
   * listener will never call `preventDefault()`. If a passive listener calls
   * `preventDefault()`, nothing will happen and a console warning may be
   * generated.
   * @default false
   */
  readonly once?: boolean

  /**
   * How many elements sent by event target to buffer while waiting for the
   * moment they are consumed. Can be limited to a certain number
   * @default "unbounded"
   */
  readonly bufferSize?: number | 'unbounded' | undefined
}

export interface StreamMakerOptionsObject<
  TOnNullStrategy extends OnNullStrategy,
> extends StreamMakerOptionsWellknown {
  /**
   * A strategy to react when the MIDI-related event will have relevant field be
   * null. Although there should be no sane scenario where it would be the case,
   * it's still allowed by the spec, and for a better DevX this lib lets the dev
   * make a decision on how to handle such cases.
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
 * Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
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
      readonly [NullableField in keyof TContainerWithNullableFields]: Exclude<
        TContainerWithNullableFields[NullableField],
        null
      >
    }
  | ([TOnNullStrategy] extends ['passthrough']
      ? {
          readonly [NullableField in keyof TContainerWithNullableFields]: null
        }
      : never)
)

export type StreamError<TOnNullStrategy extends OnNullStrategy, E> =
  | E
  | ([TOnNullStrategy] extends ['fail'] ? Cause.NoSuchElementException : never)

export interface BuiltStream<
  TTag extends string,
  TCameFrom,
  TContainerWithNullableFields extends object,
  TOnNullStrategy extends OnNullStrategy,
  E = never,
  R = never,
> extends Stream.Stream<
    StreamValue<TTag, TCameFrom, TContainerWithNullableFields, TOnNullStrategy>,
    StreamError<TOnNullStrategy, E>,
    R
  > {}

export interface DualStreamMaker<
  TCameFrom,
  TTag extends string,
  TContainerWithNullableFields extends object,
> extends MakeStreamTargetFirst<TCameFrom, TTag, TContainerWithNullableFields>,
    MakeStreamTargetLast<TCameFrom, TTag, TContainerWithNullableFields> {}

export interface MakeStreamTargetFirst<
  TCameFrom,
  TTag extends string,
  TContainerWithNullableFields extends object,
> {
  /**
   * @param polymorphicEventTargetWrapper Raw MIDI object, which triggers
   * events, wrapped in this lib's abstraction and potentially inside Effect.
   * Will be assigned to the `cameFrom` property of the stream's success channel
   * object
   *
   * @param options Passing a value of a `boolean` type is equivalent to setting
   * `options.capture` property
   */
  <
    E = never,
    R = never,
    const TOnNullStrategy extends OnNullStrategy = undefined,
  >(
    polymorphicEventTargetWrapper: PolymorphicEffect<TCameFrom, E, R>,
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

export interface MakeStreamTargetLast<
  TCameFrom,
  TTag extends string,
  TContainerWithNullableFields extends object,
> {
  /**
   * @param options Passing a value of a `boolean` type is equivalent to setting
   * `options.capture` property
   *
   * **Second call argument**
   *
   * - `polymorphicEventTargetWrapper` Raw MIDI object, which triggers events,
   *   wrapped in this lib's abstraction and potentially inside Effect. Will be
   *   assigned to the `cameFrom` property of the stream's success channel
   *   object
   */
  <const TOnNullStrategy extends OnNullStrategy = undefined>(
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): {
    /**
     * @param polymorphicEventTargetWrapper Raw MIDI object, which triggers
     * events, wrapped in this lib's abstraction and potentially inside Effect.
     * Will be assigned to the `cameFrom` property of the stream's success
     * channel object
     */
    <E = never, R = never>(
      polymorphicEventTargetWrapper: PolymorphicEffect<TCameFrom, E, R>,
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
