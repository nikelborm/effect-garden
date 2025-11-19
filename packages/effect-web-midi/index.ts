import * as EArray from 'effect/Array'
import * as Brand from 'effect/Brand'
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import { pipe } from 'effect/Function'
import * as Hash from 'effect/Hash'
import * as Option from 'effect/Option'
import * as Order from 'effect/Order'
import * as Schema from 'effect/Schema'
import * as SortedMap from 'effect/SortedMap'
import * as Stream from 'effect/Stream'
import * as Struct from 'effect/Struct'
import type * as Types from 'effect/Types'

// Built with the help of spec from here
// ! https://www.w3.org/TR/webmidi/

const ErrorSchema = Schema.Struct({
  name: Schema.NonEmptyTrimmedString,
  message: Schema.NonEmptyTrimmedString,
  stack: Schema.NonEmptyTrimmedString.pipe(
    Schema.optionalWith({ exact: true }),
  ),
  cause: Schema.Unknown.pipe(Schema.optionalWith({ exact: true })),
})

/**
 * Thrown if the document or page is closed due to user navigation.
 */
export class AbortError extends Schema.TaggedError<AbortError>('AbortError')(
  'AbortError',
  { cause: ErrorSchema },
) {}

/**
 * Thrown if the underlying system raises any errors.
 */
export class InvalidStateError extends Schema.TaggedError<InvalidStateError>(
  'InvalidStateError',
)('InvalidStateError', { cause: ErrorSchema }) {}

/**
 * Thrown if the feature or options are not supported by the system.
 */
export class NotSupportedError extends Schema.TaggedError<NotSupportedError>(
  'NotSupportedError',
)('NotSupportedError', { cause: ErrorSchema }) {}

/**
 * The object does not support the operation or argument. Thrown if the port is
 * unavailable.
 */
export class InvalidAccessError extends Schema.TaggedError<InvalidAccessError>(
  'InvalidAccessError',
)('InvalidAccessError', { cause: ErrorSchema }) {}

/**
 * Thrown if the user or system denies the application from creating a
 * MIDIAccess object with the requested options, or if the document is not
 * allowed to use the feature (for example, because of a Permission Policy, or
 * because the user previously denied a permission request).
 *
 * SecurityError in MIDI spec was replaced by NotAllowedError.
 */
export class NotAllowedError extends Schema.TaggedError<NotAllowedError>(
  'NotAllowedError',
)('NotAllowedError', { cause: ErrorSchema }) {}

export class BadMidiMessageError extends Schema.TaggedError<BadMidiMessageError>(
  'BadMidiMessageError',
)('BadMidiMessageError', { cause: ErrorSchema }) {}

/**
 * Unique identifier of the MIDI port.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/id)
 */
export type MIDIPortId = string & Brand.Brand<'MIDIPortId'>

export type CreateStreamFromEventListenerOptions = Parameters<
  typeof Stream.fromEventListener
>[2]

export const MIDIPortId = Brand.nominal<MIDIPortId>()

type OnNullConfigField<TNullableFieldName extends string> =
  `on${Capitalize<TNullableFieldName>}Null`

type StreamMakerOptions<
  TNullableFieldName extends string,
  TOnNullStrategy extends OnNullStrategy,
> = CreateStreamFromEventListenerOptions & {
  [k in OnNullConfigField<TNullableFieldName>]?: TOnNullStrategy
}

type OnNullStrategy = 'fail' | 'die' | 'ignore' | 'passthrough' | undefined

const missingDataMessage = 'Property data of MIDIMessageEvent is null'

// It's important to keep StreamValue as a separate generic because typescript
// is a bit dumb
type StreamValue<
  TCameFrom,
  TNullableFieldName extends Extract<keyof TSelectedEvent, string>,
  TSelectedEvent,
  TOnNullStrategy extends OnNullStrategy,
> = {
  readonly cameFrom: TCameFrom
} & {
  readonly [k in TNullableFieldName]:
    | Exclude<TSelectedEvent[TNullableFieldName], null | undefined>
    | ([TOnNullStrategy] extends ['passthrough']
        ? Extract<TSelectedEvent[TNullableFieldName], null | undefined>
        : never)
}

type StreamError<TOnNullStrategy extends OnNullStrategy> = [
  TOnNullStrategy,
] extends ['fail']
  ? Cause.NoSuchElementException
  : never

const createStreamMakerFrom =
  <TEventTypeToEventValueMap extends object>() =>
  <
    TEventTarget extends Stream.EventListener<
      TEventTypeToEventValueMap[TSelectedEventType]
    >,
    const TNullableFieldName extends Extract<
      keyof TEventTypeToEventValueMap[TSelectedEventType],
      string
    >,
    TSelectedEventType extends Extract<keyof TEventTypeToEventValueMap, string>,
    TSelectedEvent extends TEventTypeToEventValueMap[TSelectedEventType],
    TCameFrom,
  >({
    eventListener: { target, type },
    spanAttributes,
    nullableFieldName: field,
    cameFrom,
  }: {
    eventListener: { target: TEventTarget; type: TSelectedEventType }
    spanAttributes: { spanTargetName: string; [k: string]: unknown }
    nullableFieldName: TNullableFieldName
    cameFrom: TCameFrom
  }) =>
  <const TOnNullStrategy extends OnNullStrategy = undefined>(
    options?: StreamMakerOptions<TNullableFieldName, TOnNullStrategy>,
  ): Stream.Stream<
    StreamValue<TCameFrom, TNullableFieldName, TSelectedEvent, TOnNullStrategy>,
    StreamError<TOnNullStrategy>
  > => {
    const onNullStrategy =
      options?.[
        `on${field.charAt(0).toUpperCase() + field.slice(1)}Null` as OnNullConfigField<TNullableFieldName>
      ]
    return Stream.fromEventListener(target, type, options).pipe(
      Stream.filter(event => !!event[field] || onNullStrategy !== 'ignore'),
      Stream.mapEffect(event =>
        event[field] || onNullStrategy === 'passthrough'
          ? Effect.succeed({ [field]: event[field], cameFrom })
          : onNullStrategy === undefined || onNullStrategy === 'die'
            ? Effect.dieMessage(missingDataMessage)
            : new Cause.NoSuchElementException(missingDataMessage),
      ),
      Stream.withSpan('MIDI Web API event stream', {
        kind: 'producer',
        attributes: { eventType: type, ...spanAttributes },
      }),
    ) as any
  }

const midiPortStaticFields = [
  'id',
  'name',
  'manufacturer',
  'version',
  'type',
] as const

type MIDIPortStaticFields = (typeof midiPortStaticFields)[number]

const remapErrorByName =
  <
    TDomExceptionNameToErrorWrapperClassMap extends {
      [name: string]: new (arg: {
        cause: Schema.Schema.Encoded<typeof ErrorSchema>
      }) => Error
    },
  >(
    map: TDomExceptionNameToErrorWrapperClassMap,
    absurdMessage: string,
  ) =>
  (cause: unknown) => {
    if (!(cause instanceof Error && cause.name in map))
      throw new Error(absurdMessage)
    type TErrorClassUnion =
      TDomExceptionNameToErrorWrapperClassMap[keyof TDomExceptionNameToErrorWrapperClassMap]
    const Class = map[cause.name] as TErrorClassUnion
    return new Class({ cause }) as InstanceType<TErrorClassUnion>
  }

export const requestRawMIDIAccess = (options?: MIDIOptions) =>
  Effect.tryPromise({
    try: () => navigator.requestMIDIAccess(options),
    catch: remapErrorByName(
      {
        AbortError,
        InvalidStateError,
        NotSupportedError,
        NotAllowedError,
        // because of https://github.com/WebAudio/web-midi-api/pull/267
        SecurityError: NotAllowedError,
        // For case when navigator doesn't exist
        ReferenceError: NotSupportedError,
        // For case when navigator.requestMIDIAccess is undefined
        TypeError: NotSupportedError,
      },
      'requestRawMIDIAccess error handling absurd',
    ),
  }).pipe(
    Effect.withSpan('Request raw MIDI access', { attributes: { options } }),
  )

const getStaticMIDIPortInfo = (port: MIDIPort) =>
  Struct.pick(port, ...midiPortStaticFields)

class RawAccessContainer {
  protected readonly rawAccess: MIDIAccess
  protected readonly config: MIDIOptions | undefined
  constructor(rawAccess: MIDIAccess, config?: MIDIOptions) {
    this.rawAccess = rawAccess
    this.config = config
  }
}

type ReadonlyMapValue<T> = T extends ReadonlyMap<unknown, infer V> ? V : never

type NewPortState = {
  ofDevice: MIDIPortDeviceState
  ofConnection: MIDIPortConnectionState
}

type ConnectionStateStreamValue<
  TCameFrom,
  TOnNullStrategy extends OnNullStrategy,
> = {
  cameFrom: TCameFrom
} & (
  | {
      newState: NewPortState
      port: EffectfulMIDIInputPort | EffectfulMIDIOutputPort
    }
  | ([TOnNullStrategy] extends ['passthrough']
      ? { newState: null; port: null }
      : never)
)

type ConnectionStateChangesStream<
  TCameFrom,
  TOnNullStrategy extends OnNullStrategy,
> = Stream.Stream<
  ConnectionStateStreamValue<TCameFrom, TOnNullStrategy>,
  StreamError<TOnNullStrategy>
>

const makeConnectionStateChangesStream =
  <TEventTarget extends Stream.EventListener<MIDIConnectionEvent>, TCameFrom>({
    eventListenerTarget: eventTarget,
    spanAttributes,
    cameFrom,
  }: {
    eventListenerTarget: TEventTarget
    spanAttributes: { spanTargetName: string; [k: string]: unknown }
    cameFrom: TCameFrom
  }) =>
  <const TOnNullStrategy extends OnNullStrategy = undefined>(
    options?: StreamMakerOptions<'port', TOnNullStrategy>,
  ): ConnectionStateChangesStream<TCameFrom, TOnNullStrategy> =>
    pipe(
      options,
      createStreamMakerFrom<{ statechange: MIDIConnectionEvent }>()({
        eventListener: { target: eventTarget, type: 'statechange' },
        spanAttributes,
        nullableFieldName: 'port',
        cameFrom,
      }),
      Stream.map(
        ({ port }) =>
          ({
            cameFrom,
            newState: port && {
              ofDevice: port.state,
              ofConnection: port.connection,
            },
            port:
              cameFrom instanceof EffectfulMIDIInputPort ||
              cameFrom instanceof EffectfulMIDIOutputPort
                ? cameFrom
                : port instanceof MIDIInput
                  ? new EffectfulMIDIInputPort(port)
                  : port instanceof MIDIOutput
                    ? new EffectfulMIDIOutputPort(port)
                    : null,
          }) as ConnectionStateStreamValue<TCameFrom, TOnNullStrategy>,
      ),
    )

export class EffectfulMIDIAccess
  extends RawAccessContainer
  implements Pick<MIDIAccess, 'sysexEnabled'>
{
  readonly #mapMutablePortMap = <
    const TMIDIAccessObjectKey extends 'inputs' | 'outputs',
    TRawMIDIPort extends ReadonlyMapValue<MIDIAccess[TMIDIAccessObjectKey]>,
    TEffectfulMIDIPort extends EffectfulMIDIPort<TRawMIDIPort>,
  >(
    key: TMIDIAccessObjectKey,
    Class: new (port: TRawMIDIPort) => TEffectfulMIDIPort,
  ) =>
    Effect.sync(() =>
      pipe(
        this.rawAccess[key] as ReadonlyMap<MIDIPortId, TRawMIDIPort>,
        SortedMap.fromIterable(Order.string),
        SortedMap.map(port => new Class(port)),
      ),
    )

  /**
   * Because MIDIInputMap can potentially be a mutable object, meaning new
   * devices can be added or removed at runtime, it is effectful.
   *
   * The **`inputs`** read-only property of the MIDIAccess interface provides
   * access to any available MIDI input ports.
   *
   * [MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIAccess/inputs)
   */
  readonly inputs = this.#mapMutablePortMap('inputs', EffectfulMIDIInputPort)

  /**
   * Because MIDIOutputMap can potentially be a mutable object, meaning new
   * devices can be added or removed at runtime, it is effectful.
   *
   * The **`outputs`** read-only property of the MIDIAccess interface provides
   * access to any available MIDI output ports.
   *
   * [MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIAccess/outputs)
   */
  readonly outputs = this.#mapMutablePortMap('outputs', EffectfulMIDIOutputPort)

  /**
   * [MIDIConnectionEvent MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
   */
  readonly makeConnectionStateChangesStream = makeConnectionStateChangesStream({
    cameFrom: this,
    eventListenerTarget: this.rawAccess,
    spanAttributes: {
      spanTargetName: 'MIDI access handle',
      requestedAccessConfig: this.config,
    },
  })

  get sysexEnabled() {
    return this.rawAccess.sysexEnabled
  }

  // TODO: add a stream to listen for all messages of all currently
  // connected inputs, all present inputs, specific input

  /**
   * beware that it's not possible to ensure the messages will either be all
   * delivered, or all not delivered, as in ACID transactions. There's not even
   * a mechanism to remove the message from the sending queue
   */
  readonly send = Effect.fn('send')(function* (
    this: EffectfulMIDIAccess,
    target:
      | 'all existing outputs at effect execution'
      | 'all open connections at effect execution'
      | MIDIPortId
      | MIDIPortId[],
    ...args: Parameters<EffectfulMIDIOutputPort['send']>
  ) {
    // TODO: implementation
    // if (
    //   target === 'all existing outputs at effect execution' ||
    //   target === 'all open connections at effect execution'
    // )
    //   return yield* Effect.void

    let portsIdsToSend: MIDIPortId[]

    const outputs = yield* this.outputs

    if (target === 'all open connections at effect execution') {
      portsIdsToSend = EArray.ensure(target)
    } else if (target === 'all existing outputs at effect execution') {
    } else portsIdsToSend = EArray.ensure(target)

    const deviceStatusesEffect = portsIdsToSend.map(id =>
      Option.match(SortedMap.get(outputs, id), {
        onNone: () => Effect.succeed('disconnected' as const),
        onSome: output => output.deviceState,
      }),
    )

    const deviceStatuses = yield* Effect.all(deviceStatusesEffect)

    if (deviceStatuses.includes('disconnected'))
      return yield* new InvalidStateError({
        cause: new DOMException(
          'InvalidStateError',
          'TODO: imitate there an error thats thrown when the port is diconnected',
        ),
      })

    const sendToSome = (predicate: (id: MIDIPortId) => boolean) =>
      Effect.all(
        SortedMap.reduce(
          outputs,
          [] as ReturnType<EffectfulMIDIOutputPort['send']>[],
          (acc, port, id) =>
            predicate(id) ? (acc.push(port.send(...args)), acc) : acc,
        ),
      )

    yield* sendToSome(id => portsIdsToSend.includes(id))
  }).bind(this)
}

class RawPortContainer<TRawMIDIPort extends MIDIPort> {
  protected readonly rawPort: TRawMIDIPort
  constructor(rawPort: TRawMIDIPort) {
    this.rawPort = rawPort
  }
}

export class EffectfulMIDIPort<TRawMIDIPort extends MIDIPort>
  extends RawPortContainer<TRawMIDIPort>
  implements Pick<MIDIPort, MIDIPortStaticFields>, Equal.Equal
{
  [Hash.symbol]() {
    return Hash.string(this.id)
  }
  [Equal.symbol](that: Equal.Equal) {
    return 'id' in that && this.id === that.id
  }

  /**
   * [MIDIConnectionEvent MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
   */
  readonly makeConnectionStateChangesStream = <
    const TOnNullStrategy extends OnNullStrategy = undefined,
  >(
    options?: StreamMakerOptions<'port', TOnNullStrategy>,
  ) =>
    pipe(
      options,
      makeConnectionStateChangesStream({
        cameFrom: this,
        eventListenerTarget: this.rawPort,
        spanAttributes: {
          spanTargetName: 'MIDI port',
          port: getStaticMIDIPortInfo(this.rawPort),
        },
      }),
      Stream.map(
        ({ port, ...rest }) =>
          rest as Types.Simplify<
            Omit<ConnectionStateStreamValue<this, TOnNullStrategy>, 'port'>
          >,
      ),
    )

  /**
   * Because device state can change over time, it's effectful.
   * The **`state`** read-only property of the MIDIPort interface returns the
   * state of the port.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/state)
   */
  readonly deviceState = Effect.sync(() => this.rawPort.state)

  /**
   * Because connection state can change over time, it's effectful.
   *
   * The **`connection`** read-only property of the MIDIPort interface returns
   * the connection state of the port.
   *
   * [MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/connection)
   */
  readonly connectionState = Effect.sync(() => this.rawPort.connection)

  readonly #callMIDIPortMethod = <TError = never>(
    method: 'close' | 'open',
    mapError: (err: unknown) => TError,
  ): Effect.Effect<this, TError> =>
    pipe(
      Effect.tryPromise({ try: () => this.rawPort[method](), catch: mapError }),
      Effect.map(() => this),
      Effect.withSpan(`MIDI port method call`, {
        attributes: { method, port: getStaticMIDIPortInfo(this.rawPort) },
      }),
    )

  // TODO: documentation
  readonly open = this.#callMIDIPortMethod(
    'open',
    remapErrorByName(
      { InvalidAccessError },
      'MIDI port open error handling absurd',
    ),
  )

  // TODO: documentation
  readonly close = this.#callMIDIPortMethod('close', err => {
    throw err
  })

  get id() {
    return this.rawPort.id
  }

  get name() {
    return this.rawPort.name
  }

  get manufacturer() {
    return this.rawPort.manufacturer
  }

  get version() {
    return this.rawPort.version
  }

  get type() {
    return this.rawPort.type
  }
}

export class EffectfulMIDIInputPort extends EffectfulMIDIPort<MIDIInput> {
  /**
   * [MIDIMessageEvent MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIMessageEvent)
   *
   * MIDI spec says that synthetically built messages can have `data` field
   * equal to null, but in all other normal cases it's not. The default behavior
   * is to die on null.
   */
  readonly makeMessagesStream = createStreamMakerFrom<MIDIInputEventMap>()({
    eventListener: { target: this.rawPort, type: 'midimessage' },
    spanAttributes: {
      spanTargetName: 'MIDI port',
      port: getStaticMIDIPortInfo(this.rawPort),
    },
    cameFrom: this,
    nullableFieldName: 'data',
  })
}

export class EffectfulMIDIOutputPort extends EffectfulMIDIPort<MIDIOutput> {
  // TODO: add documentation
  /**
   * If data is a System Exclusive message, and the MIDIAccess did not enable
   * System Exclusive access, an InvalidAccessError exception will be thrown
   *
   * If the port is "connected" but the connection is "closed", asynchronously
   * tries to open the port. It's unclear in the spec if potential error of
   * `open` call would result in an InvalidAccessError error coming from the
   * send method itself.
   */
  readonly send = (data: Iterable<number>, timestamp?: DOMHighResTimeStamp) =>
    Effect.try({
      try: () => this.rawPort.send(data, timestamp),
      catch: remapErrorByName(
        {
          InvalidAccessError,
          InvalidStateError,
          TypeError: BadMidiMessageError,
        },
        'MIDI port open error handling absurd',
      ),
    }).pipe(
      Effect.withSpan('EffectfulMIDIOutputPort.send', {
        attributes: {
          data,
          timestamp,
          port: getStaticMIDIPortInfo(this.rawPort),
        },
      }),
    )

  // TODO: fix upstream type-signature, add documentation
  // @ts-ignore
  readonly clear = Effect.sync(() => this.rawPort.clear()).pipe(
    Effect.withSpan('EffectfulMIDIOutputPort.clear', {
      attributes: { port: getStaticMIDIPortInfo(this.rawPort) },
    }),
  )
}

export const requestEffectfulMIDIAccess = (config?: MIDIOptions) =>
  Effect.map(
    requestRawMIDIAccess(config),
    access => new EffectfulMIDIAccess(access, config),
  )
