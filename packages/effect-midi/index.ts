import * as Brand from 'effect/Brand'
import * as Effect from 'effect/Effect'
import { flow, pipe } from 'effect/Function'
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
export type MidiPortIdentifier = string & Brand.Brand<'MidiPortIdentifier'>

export type CreateStreamFromEventListenerOptions = Parameters<
  typeof Stream.fromEventListener
>[2]

export const MidiPortIdentifier = Brand.nominal<MidiPortIdentifier>()

const createStreamFrom =
  <EventTypeToEventValueMap extends {}>() =>
  <
    TEventTarget extends EventTarget,
    SelectedEventType extends Extract<keyof EventTypeToEventValueMap, string>,
  >({
    event: { target, type },
    spanAttributes,
  }: {
    event: { target: TEventTarget; type: SelectedEventType }
    spanAttributes: { spanTargetName: string; [k: string]: unknown }
  }) =>
  (options?: CreateStreamFromEventListenerOptions) =>
    pipe(
      Stream.fromEventListener(target, type, options),
      Stream.withSpan('MIDI Web API event stream', {
        kind: 'producer',
        attributes: { eventType: type, ...spanAttributes },
      }),
    ) as Stream.Stream<EventTypeToEventValueMap[SelectedEventType]>

const midiPortStaticFields = [
  'id',
  'name',
  'manufacturer',
  'version',
  'type',
] as const

type MidiPortStaticFields = (typeof midiPortStaticFields)[number]

const remapDomExceptionByName =
  <
    Map extends Record<
      string,
      new (arg: {
        cause: Schema.Schema.Encoded<typeof DOMExceptionSchema>
      }) => Error
    >,
  >(
    map: Map,
    absurdMessage: string,
  ) =>
  (cause: unknown) => {
    if (!(cause instanceof DOMException && cause.name in map))
      throw new Error(absurdMessage)
    type ErrorClassUnion = Map[keyof Map]
    const Class = map[cause.name] as ErrorClassUnion
    return new Class({ cause }) as InstanceType<ErrorClassUnion>
  }

export const requestRawMIDIAccess = (options?: MIDIOptions) =>
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

export interface ConnectionStreamMaker {
  /**
   * [MIDIConnectionEvent MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
   */
  makeConnectionStateChangesStream: (
    options?: CreateStreamFromEventListenerOptions,
  ) => Stream.Stream<MIDIConnectionEvent, never, never>
}

export interface EffectfulMIDIPort
  extends Pick<MIDIPort, MidiPortStaticFields>,
    ConnectionStreamMaker {
  /**
   * Because state can change over time, it's effectful.
   * The **`state`** read-only property of the MIDIPort interface returns the
   * state of the port.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/state)
   */
  readonly deviceState: Effect.Effect<MIDIPort['state']>

  /**
   * Because connection state can change over time, it's effectful.
   *
   * The **`connection`** read-only property of the MIDIPort interface returns
   * the connection state of the port.
   *
   * [MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/connection)
   */
  readonly connectionState: Effect.Effect<MIDIPort['connection']>

  // TODO: documentation
  readonly open: Effect.Effect<this, InvalidAccessError>
  readonly close: Effect.Effect<this>
}

export interface EffectfulMIDIInputPort extends EffectfulMIDIPort {
  /**
   * [MIDIMessageEvent MDN
   * Reference](https://developer.mozilla.org/docs/Web/API/MIDIMessageEvent)
   */
  makeMessagesStream: (
    options?: CreateStreamFromEventListenerOptions,
    // TODO: check why the fuck MIDIMessageEvent has null as the value of data field in typescript
  ) => Stream.Stream<
    {
      data: Uint8Array<ArrayBuffer> | null
      cameFromInputPort: EffectfulMIDIInputPort
    },
    never,
    never
  >
}

export interface EffectfulMIDIOutputPort extends EffectfulMIDIPort {
  // TODO: documentation
  send(
    data: Iterable<number>,
    timestamp?: DOMHighResTimeStamp,
  ): Effect.Effect<
    void,
    InvalidAccessError | InvalidStateError | TypeError,
    never
  >

  readonly clear: Effect.Effect<void>
}

export interface EffectfulMidiAccess
  extends Pick<MIDIAccess, 'sysexEnabled'>,
    ConnectionStreamMaker {
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
  readonly inputs: Effect.Effect<
    SortedMap.SortedMap<MidiPortIdentifier, EffectfulMIDIInputPort>
  >

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
  readonly outputs: Effect.Effect<
    SortedMap.SortedMap<MidiPortIdentifier, EffectfulMIDIOutputPort>
  >
}

const getStaticMidiPortInfo = (port: MIDIPort) =>
  Struct.pick(port, ...midiPortStaticFields)

const mapMIDIPortToEffectfulInstanceCommonPart = <
  RawPort extends MIDIPort,
  EffectfulPort extends EffectfulMIDIPort,
>(
  port: RawPort,
  getMappedPort: () => EffectfulPort,
) => {
  const staticMidiPortInfo = getStaticMidiPortInfo(port)

  const callMIDIInputPortMethod = <E = never>(
    method: 'close' | 'open',
    mapError: (err: unknown) => E,
  ) =>
    pipe(
      Effect.tryPromise({ try: () => port[method](), catch: mapError }),
      Effect.map(getMappedPort),
      Effect.withSpan(`MIDI port method call`, {
        attributes: { method, port: staticMidiPortInfo },
      }),
    )

  return {
    ...staticMidiPortInfo,
    // deviceState and connectionState are effectful, because they can change
    // over time
    deviceState: Effect.sync(() => port.state),
    connectionState: Effect.sync(() => port.connection),
    open: callMIDIInputPortMethod(
      'open',
      remapDomExceptionByName(
        { InvalidAccessError },
        'MIDI port open error handling absurd',
      ),
    ),
    close: callMIDIInputPortMethod('close', err => {
      throw err
    }),
    makeConnectionStateChangesStream: createStreamFrom<MIDIPortEventMap>()({
      event: { target: port, type: 'statechange' },
      spanAttributes: { spanTargetName: 'MIDI port', port: staticMidiPortInfo },
    }),
  }
}

const mapMIDIInputPortToEffectfulInstance = (inputPort: MIDIInput) => {
  const mappedPort: EffectfulMIDIInputPort = {
    ...mapMIDIPortToEffectfulInstanceCommonPart(inputPort, () => mappedPort),
    makeMessagesStream: flow(
      createStreamFrom<MIDIInputEventMap>()({
        event: { target: inputPort, type: 'midimessage' },
        spanAttributes: {
          spanTargetName: 'MIDI port',
          port: getStaticMidiPortInfo(inputPort),
        },
      }),
      Stream.map(e => ({ data: e.data, cameFromInputPort: mappedPort })),
    ),
  }
  return mappedPort
}

const mapMIDIOutputPortToEffectfulInstance = (outputPort: MIDIOutput) => {
  const mappedPort: EffectfulMIDIOutputPort = {
    ...mapMIDIPortToEffectfulInstanceCommonPart(outputPort, () => mappedPort),
    // TODO: properly remap errors, add telemetry
    send: (data, timestamp) =>
      Effect.try({
        try: () => outputPort.send(data, timestamp),
        catch: cause =>
          cause instanceof TypeError
            ? cause
            : remapDomExceptionByName(
                { InvalidAccessError, InvalidStateError },
                'MIDI port open error handling absurd',
              )(cause),
      }),
    // TODO: fix upstream type-signature
    // @ts-ignore
    clear: Effect.sync(() => outputPort.clear()),
  }
  return mappedPort
}

const mapMutablePortMap = <
  TSourcePort extends MIDIPort,
  TRemappedPort extends EffectfulMIDIPort,
>(
  getPortMap: () => ReadonlyMap<string, TSourcePort>,
  remap: (port: TSourcePort) => TRemappedPort,
) =>
  Effect.sync(() =>
    pipe(
      getPortMap() as ReadonlyMap<MidiPortIdentifier, TSourcePort>,
      SortedMap.fromIterable(Order.string),
      SortedMap.map(remap),
    ),
  )

export const requestEffectfulMIDIAccess = (
  options?: MIDIOptions,
): Effect.Effect<
  EffectfulMidiAccess,
  AbortError | InvalidStateError | NotSupportedError | NotAllowedError
> =>
  Effect.map(requestRawMIDIAccess(options), access => ({
    // inputs and outputs SortedMaps are effectful, because they can change
    // over time
    inputs: mapMutablePortMap(
      () => access.inputs,
      mapMIDIInputPortToEffectfulInstance,
    ),
    outputs: mapMutablePortMap(
      () => access.outputs,
      mapMIDIOutputPortToEffectfulInstance,
    ),
    makeConnectionStateChangesStream: createStreamFrom<MIDIAccessEventMap>()({
      event: { target: access, type: 'statechange' },
      spanAttributes: {
        spanTargetName: 'MIDI access handle',
        port: options,
      },
    }),
    sysexEnabled: access.sysexEnabled,
  }))
