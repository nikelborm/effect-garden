import * as Brand from 'effect/Brand'
import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import { flow, pipe } from 'effect/Function'
import * as Hash from 'effect/Hash'
import * as Order from 'effect/Order'
import * as Schema from 'effect/Schema'
import * as SortedMap from 'effect/SortedMap'
import * as Stream from 'effect/Stream'
import * as Struct from 'effect/Struct'

const DOMExceptionSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  message: Schema.NonEmptyString,
  stack: Schema.NonEmptyString.pipe(Schema.optionalWith({ exact: true })),
  cause: Schema.Unknown.pipe(Schema.optionalWith({ exact: true })),
})

/**
 * Thrown if the document or page is closed due to user navigation.
 */
export class AbortError extends Schema.TaggedError<AbortError>('AbortError')(
  'AbortError',
  { cause: DOMExceptionSchema },
) {}

/**
 * Thrown if the underlying system raises any errors.
 */
export class InvalidStateError extends Schema.TaggedError<InvalidStateError>(
  'InvalidStateError',
)('InvalidStateError', { cause: DOMExceptionSchema }) {}

/**
 * Thrown if the feature or options are not supported by the system.
 */
export class NotSupportedError extends Schema.TaggedError<NotSupportedError>(
  'NotSupportedError',
)('NotSupportedError', { cause: DOMExceptionSchema }) {}

/**
 * The object does not support the operation or argument. Thrown if the port is
 * unavailable.
 */
export class InvalidAccessError extends Schema.TaggedError<InvalidAccessError>(
  'InvalidAccessError',
)('InvalidAccessError', { cause: DOMExceptionSchema }) {}

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
)('NotAllowedError', { cause: DOMExceptionSchema }) {}

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

const createStreamFrom =
  <TEventTypeToEventValueMap extends {}>() =>
  <
    TEventTarget extends EventTarget,
    TSelectedEventType extends Extract<keyof TEventTypeToEventValueMap, string>,
  >({
    event: { target, type },
    spanAttributes,
  }: {
    event: { target: TEventTarget; type: TSelectedEventType }
    spanAttributes: { spanTargetName: string; [k: string]: unknown }
  }) =>
  (options?: CreateStreamFromEventListenerOptions) =>
    pipe(
      Stream.fromEventListener(target, type, options),
      Stream.withSpan('MIDI Web API event stream', {
        kind: 'producer',
        attributes: { eventType: type, ...spanAttributes },
      }),
    ) as Stream.Stream<TEventTypeToEventValueMap[TSelectedEventType]>

const midiPortStaticFields = [
  'id',
  'name',
  'manufacturer',
  'version',
  'type',
] as const

type MIDIPortStaticFields = (typeof midiPortStaticFields)[number]

const remapDomExceptionByName =
  <
    TDomExceptionNameToErrorWrapperClassMap extends {
      [name: string]: new (arg: {
        cause: Schema.Schema.Encoded<typeof DOMExceptionSchema>
      }) => Error
    },
  >(
    map: TDomExceptionNameToErrorWrapperClassMap,
    absurdMessage: string,
  ) =>
  (cause: unknown) => {
    if (!(cause instanceof DOMException && cause.name in map))
      throw new Error(absurdMessage)
    type TErrorClassUnion =
      TDomExceptionNameToErrorWrapperClassMap[keyof TDomExceptionNameToErrorWrapperClassMap]
    const Class = map[cause.name] as TErrorClassUnion
    return new Class({ cause }) as InstanceType<TErrorClassUnion>
  }

export const requestRawMIDIAccess = (options?: MIDIOptions) =>
  // TODO: properly handle ReferenceError, and 'not a function eror', etc
  (navigator.requestMIDIAccess
    ? Effect.tryPromise({
        try: () => navigator.requestMIDIAccess(options),
        catch: cause =>
          remapDomExceptionByName(
            {
              AbortError,
              InvalidStateError,
              NotSupportedError,
              NotAllowedError,
              // because of https://github.com/WebAudio/web-midi-api/pull/267
              SecurityError: NotAllowedError,
            },
            'requestRawMIDIAccess error handling absurd',
          )(cause),
      })
    : Effect.fail(
        new NotSupportedError({
          cause: new DOMException(
            'navigator.requestMIDIAccess is not present in the current browser',
            'NotSupportedError',
          ),
        }),
      )
  ).pipe(
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

export class EffectfulMIDIAccess
  extends RawAccessContainer
  implements Pick<MIDIAccess, 'sysexEnabled'>
{
  readonly #mapMutablePortMap = <
    const TAccessObjectKey extends 'inputs' | 'outputs',
    TRawMIDIPort extends ReadonlyMapValue<MIDIAccess[TAccessObjectKey]>,
    TEffectfulMIDIPort extends EffectfulMIDIPort<TRawMIDIPort>,
  >(
    key: TAccessObjectKey,
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
  // TODO: dynamic null removal based on parameters and type-signature, and make
  // it removed from typesignature by-default; options: fail, die, skip, pass
  // TODO: remap stream, extract status fields, and make effectful port field
  readonly makeConnectionStateChangesStream =
    createStreamFrom<MIDIAccessEventMap>()({
      event: { target: this.rawAccess, type: 'statechange' },
      spanAttributes: {
        spanTargetName: 'MIDI access handle',
        requestedAccessConfig: this.config,
      },
    })

  get sysexEnabled() {
    return this.rawAccess.sysexEnabled
  }
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
  // TODO: dynamic null removal based on parameters and type-signature, and make
  // it removed from typesignature by-default; options: fail, die, skip, pass
  // TODO: remap stream, extract status fields, and make effectful port field
  readonly makeConnectionStateChangesStream =
    createStreamFrom<MIDIPortEventMap>()({
      event: { target: this.rawPort, type: 'statechange' },
      spanAttributes: {
        spanTargetName: 'MIDI port',
        port: getStaticMIDIPortInfo(this.rawPort),
      },
    })

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
    remapDomExceptionByName(
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
   */
  // TODO: dynamic null removal based on parameters and type-signature, and make
  // it removed from typesignature by-default; options: fail, die, skip, pass
  readonly makeMessagesStream = flow(
    createStreamFrom<MIDIInputEventMap>()({
      event: { target: this.rawPort, type: 'midimessage' },
      spanAttributes: {
        spanTargetName: 'MIDI port',
        port: getStaticMIDIPortInfo(this.rawPort),
      },
    }),
    Stream.map(e => ({
      data: e.data,
      cameFromInputPort: this as EffectfulMIDIInputPort,
    })),
  )
}

export class EffectfulMIDIOutputPort extends EffectfulMIDIPort<MIDIOutput> {
  // TODO: properly remap errors, add telemetry, documentation
  readonly send = (data: Iterable<number>, timestamp?: DOMHighResTimeStamp) =>
    Effect.try({
      try: () => this.rawPort.send(data, timestamp),
      catch: cause =>
        (cause instanceof TypeError
          ? cause
          : remapDomExceptionByName(
              { InvalidAccessError, InvalidStateError },
              'MIDI port open error handling absurd',
            )(cause)) as InvalidAccessError | InvalidStateError | TypeError,
    })

  // TODO: fix upstream type-signature, add documentation
  // @ts-ignore
  readonly clear = Effect.sync(() => this.rawPort.clear())
}

export const requestEffectfulMIDIAccess = (config?: MIDIOptions) =>
  Effect.map(
    requestRawMIDIAccess(config),
    access => new EffectfulMIDIAccess(access, config),
  )
