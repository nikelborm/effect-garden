/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */
import * as EArray from 'effect/Array'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import { dual, flow, pipe } from 'effect/Function'
import * as Hash from 'effect/Hash'
import * as Inspectable from 'effect/Inspectable'
import * as Iterable from 'effect/Iterable'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Pipeable from 'effect/Pipeable'
import * as Record from 'effect/Record'
import type * as Types from 'effect/Types'
import {
  createStreamMakerFrom,
  type OnNullStrategy,
  type StreamMakerOptions,
} from './createStreamMakerFrom.ts'
import * as EffectfulMIDIInputPort from './EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from './EffectfulMIDIOutputPort.ts'
import * as EffectfulMIDIPort from './EffectfulMIDIPort.ts'
import {
  AbortError,
  DisconnectedPortError,
  NotAllowedError,
  NotSupportedError,
  remapErrorByName,
  UnderlyingSystemError,
} from './errors.ts'
import {
  fromPolymorphic,
  type MIDIPortId,
  type PolymorphicEffect,
  polymorphicCheckInDual,
  type SentMessageEffectFrom,
} from './util.ts'

// TODO: add stream of messages sent from this device to target midi device

// TODO: fat service APIs, where all the methods are attached to instance and
// you don't have to constantly write the prefix

// TODO: implement scoping of midi access that will cleanup all message queues
// and streams, and remove listeners

// TODO: implement scope inheritance

// TODO: make a Ref with a port map that would be automatically updated by
// listening to the stream of connection events?

// TODO: add a stream to listen for all messages of all currently
// connected inputs, all present inputs, specific input

// TODO: add sinks that will accepts command streams to redirect midi commands
// from something into an actual API

// TODO: add effect to wait until connected by port id

/**
 * Unique symbol used for distinguishing {@linkcode EffectfulMIDIAccessInstance}
 * instances from other objects at both runtime and type-level
 * @internal
 */
const TypeId: unique symbol = Symbol.for(
  '@nikelborm/effect-web-midi/EffectfulMIDIAccessInstance',
)

/**
 * Unique symbol used for distinguishing {@linkcode EffectfulMIDIAccessInstance}
 * instances from other objects at both runtime and type-level
 */
export type TypeId = typeof TypeId

/**
 * A tag that allows to provide
 * {@linkcode EffectfulMIDIAccessInstance|access instance} once with e.g.
 * {@linkcode layer}, {@linkcode layerSystemExclusiveSupported}, etc and reuse
 * it anywhere, instead of repeatedly {@linkcode request}ing it.
 *
 * The downside to using DI might be that in different places of the app there
 * would be harder to maintain tight MIDI permission scopes.
 *
 * @example
 * ```ts
 * import { EffectfulMIDIAccess } from '@nikelborm/effect-web-midi'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   //  ^ Effect.Effect<
 *   //      void,
 *   //      AbortError | InvalidStateError | NotSupportedError | NotAllowedError,
 *   //      never
 *   //    >
 *
 *   const access = yield* EffectfulMIDIAccess.EffectfulMIDIAccess
 *   //    ^ EffectfulMIDIAccessInstance
 *
 *   console.log(access.sysexEnabled)
 *   //                 ^ true
 * }).pipe(Effect.provide(EffectfulMIDIAccess.layerSystemExclusiveSupported))
 * ```
 *
 * @see `navigator.requestMIDIAccess` {@link https://www.w3.org/TR/webmidi/#dom-navigator-requestmidiaccess|WebMIDI spec}, {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess|MDN reference}
 */
export class EffectfulMIDIAccess extends Context.Tag(
  '@nikelborm/effect-web-midi/EffectfulMIDIAccess',
)<EffectfulMIDIAccess, EffectfulMIDIAccessInstance>() {}

interface RequestMIDIAccessOptions {
  /**
   * This field informs the system whether the ability to send and receive
   * `System Exclusive` messages is requested or allowed on a given
   * {@linkcode EffectfulMIDIAccessInstance} object.
   *
   * If this field is set to `true`, but `System Exclusive` support is denied
   * (either by policy or by user action), the access request will fail with a
   * {@linkcode NotAllowedError} error.
   *
   * If this support is not requested (and allowed), the system will throw
   * exceptions if the user tries to send `System Exclusive` messages, and will
   * silently mask out any `System Exclusive` messages received on the port.
   *
   * @default false
   * @see {@link https://www.w3.org/TR/webmidi/#dom-midioptions-software|WebMIDI spec}, {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess#software|MDN reference}
   */
  readonly software?: boolean

  /**
   * This field informs the system whether the ability to utilize any software
   * synthesizers installed in the host system is requested or allowed on a
   * given {@linkcode EffectfulMIDIAccessInstance} object.
   *
   * If this field is set to `true`, but software synthesizer support is denied
   * (either by policy or by user action), the access request will fail with a
   * {@linkcode NotAllowedError} error.
   *
   * If this support is not requested, {@linkcode AllPortsRecord},
   * {@linkcode getInputPortsRecord}, {@linkcode OutputPortsRecord}, etc would
   * not include any software synthesizers.
   *
   * Note that may result in a two-step request procedure if software
   * synthesizer support is desired but not required - software synthesizers may
   * be disabled when MIDI hardware device access is allowed.
   *
   * @default false
   * @see {@link https://www.w3.org/TR/webmidi/#dom-midioptions-sysex|WebMIDI spec}, {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess#sysex|MDN reference}
   */
  readonly sysex?: boolean
}

// !!! DOCUMENTATION CURSOR !!!

/**
 *
 * **Errors:**
 *
 * - {@linkcode AbortError} Argument x must be non-zero
 * - {@linkcode UnderlyingSystemError} Argument x must be non-zero
 * - {@linkcode NotSupportedError} Argument x must be non-zero
 * - {@linkcode NotAllowedError} Argument x must be non-zero
 *
 * @param config
 * @returns
 */
export const layer = (config?: RequestMIDIAccessOptions) =>
  Layer.effect(EffectfulMIDIAccess, request(config))

/**
 *
 */
export const layerMostRestricted = layer()

/**
 *
 */
export const layerSystemExclusiveSupported = layer({ sysex: true })

/**
 *
 */
export const layerSoftwareSynthSupported = layer({ software: true })

/**
 *
 */
export const layerSystemExclusiveAndSoftwareSynthSupported = layer({
  software: true,
  sysex: true,
})

/**
 * Prototype of all {@linkcode EffectfulMIDIAccessInstance} instances
 * @internal
 */
const Proto = {
  _tag: 'EffectfulMIDIAccess' as const,
  [TypeId]: TypeId,
  [Hash.symbol](this: EffectfulMIDIAccessImplementationInstance) {
    return Hash.structure(this._config)
  },
  [Equal.symbol](that: Equal.Equal) {
    return this === that
  },
  pipe() {
    // biome-ignore lint/complexity/noArguments: Effect's tradition
    return Pipeable.pipeArguments(this, arguments)
  },
  toString(this: EffectfulMIDIAccessImplementationInstance) {
    return Inspectable.format(this.toJSON())
  },
  toJSON(this: EffectfulMIDIAccessImplementationInstance) {
    return { _id: 'EffectfulMIDIAccess', config: this._config }
  },
  [Inspectable.NodeInspectSymbol](
    this: EffectfulMIDIAccessImplementationInstance,
  ) {
    return this.toJSON()
  },

  get sysexEnabled() {
    return asImpl(this)._access.sysexEnabled
  },
} satisfies EffectfulMIDIAccessInstance

/**
 * Thin wrapper around {@linkcode MIDIAccess} instance. Will be seen in all of
 * the external code.
 */
export interface EffectfulMIDIAccessInstance
  extends Equal.Equal,
    Pipeable.Pipeable,
    Inspectable.Inspectable,
    Pick<MIDIAccess, 'sysexEnabled'> {
  readonly [TypeId]: TypeId
  readonly _tag: 'EffectfulMIDIAccess'
}

/**
 * Thin wrapper around {@linkcode MIDIAccess} instance giving access to the
 * actual field storing it.
 * @internal
 */
interface EffectfulMIDIAccessImplementationInstance
  extends EffectfulMIDIAccessInstance {
  readonly _access: MIDIAccess
  readonly _config: Readonly<RequestMIDIAccessOptions>
}

/**
 *
 *
 * @internal
 */
const makeImpl = (
  access: MIDIAccess,
  config?: Readonly<RequestMIDIAccessOptions>,
): EffectfulMIDIAccessImplementationInstance => {
  const instance = Object.create(Proto)
  instance._access = access
  instance._config = config ?? {}
  return instance
}

/**
 * Asserts an object to be valid EffectfulMIDIAccess and casts it to internal
 * implementation type
 *
 * @internal
 */
const asImpl = (access: EffectfulMIDIAccessInstance) => {
  if (!isImpl(access)) throw new Error('Failed to cast to EffectfulMIDIAccess')
  return access
}

/**
 *
 *
 * @internal
 */
const make: (
  access: MIDIAccess,
  config?: Readonly<RequestMIDIAccessOptions>,
) => EffectfulMIDIAccessInstance = makeImpl

/**
 *
 *
 * @internal
 */
const isImpl = (
  access: unknown,
): access is EffectfulMIDIAccessImplementationInstance =>
  typeof access === 'object' &&
  access !== null &&
  Object.getPrototypeOf(access) === Proto &&
  TypeId in access &&
  '_access' in access &&
  typeof access._access === 'object' &&
  '_config' in access &&
  typeof access._config === 'object' &&
  access._config !== null &&
  access._access instanceof MIDIAccess

/**
 *
 *
 */
export const is: (access: unknown) => access is EffectfulMIDIAccessInstance =
  isImpl

type ValueOfReadonlyMap<T> = T extends ReadonlyMap<unknown, infer V> ? V : never

/**
 *
 * @internal
 */
const getPortEntriesFromRawAccess =
  <
    const TMIDIPortType extends MIDIPortType,
    const TMIDIAccessObjectKey extends `${TMIDIPortType}s`,
    TRawMIDIPort extends ValueOfReadonlyMap<MIDIAccess[TMIDIAccessObjectKey]>,
    TEffectfulMIDIPort extends
      EffectfulMIDIPort.EffectfulMIDIPort<TMIDIPortType>,
  >(
    key: TMIDIAccessObjectKey,
    make: (port: TRawMIDIPort) => TEffectfulMIDIPort,
  ) =>
  (access: MIDIAccess) =>
    Iterable.map(
      access[key] as ReadonlyMap<MIDIPortId, TRawMIDIPort>,
      ([id, raw]) =>
        [id as MIDIPortId, make(raw)] satisfies Types.TupleOf<2, unknown>,
    )

/**
 *
 * @internal
 */
const getInputPortEntriesFromRaw = getPortEntriesFromRawAccess(
  'inputs',
  EffectfulMIDIInputPort.make,
)

/**
 *
 * @internal
 */
const getOutputPortEntriesFromRaw = getPortEntriesFromRawAccess(
  'outputs',
  EffectfulMIDIOutputPort.make,
)

/**
 *
 * @internal
 */
const getAllPortsEntriesFromRaw = (
  access: MIDIAccess,
): Iterable<
  [
    MIDIPortId,
    (
      | EffectfulMIDIInputPort.EffectfulMIDIInputPort
      | EffectfulMIDIOutputPort.EffectfulMIDIOutputPort
    ),
  ]
> =>
  Iterable.appendAll(
    getInputPortEntriesFromRaw(access),
    getOutputPortEntriesFromRaw(access),
  )

/**
 *
 * @param accessor
 * @returns
 * @internal
 */
const decorateToTakePolymorphicAccessAndReturnRecord =
  <T>(accessor: (access: MIDIAccess) => Iterable<[MIDIPortId, T]>) =>
  <E = never, R = never>(
    accessPolymorphic: PolymorphicEffect<EffectfulMIDIAccessInstance, E, R>,
  ) =>
    Effect.map(
      fromPolymorphic(accessPolymorphic, is),
      flow(asImpl, e => e._access, accessor, Record.fromEntries),
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
export const getInputPortsRecord =
  decorateToTakePolymorphicAccessAndReturnRecord(getInputPortEntriesFromRaw)

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
export const getOutputPortsRecord =
  decorateToTakePolymorphicAccessAndReturnRecord(getOutputPortEntriesFromRaw)

/**
 *
 *
 */
export const getAllPortsRecord = decorateToTakePolymorphicAccessAndReturnRecord(
  getAllPortsEntriesFromRaw,
)

/**
 *
 *
 */
export const InputPortsRecord = getInputPortsRecord(EffectfulMIDIAccess)

/**
 *
 *
 */
export const OutputPortsRecord = getOutputPortsRecord(EffectfulMIDIAccess)

/**
 *
 *
 */
export const AllPortsRecord = getAllPortsRecord(EffectfulMIDIAccess)

/**
 *
 *
 */
export const getPortByIdFromContext = (id: MIDIPortId) =>
  Effect.flatMap(AllPortsRecord, Record.get(id))

// TODO: non contextual variant
export const getPortById = getPortByIdFromContext

/**
 *
 *
 */
export const getInputPortByIdFromContext = (id: MIDIPortId) =>
  Effect.flatMap(InputPortsRecord, Record.get(id))

// TODO: non contextual variant
export const getInputPortById = getInputPortByIdFromContext

/**
 *
 *
 */
export const getOutputPortByIdFromContext = (id: MIDIPortId) =>
  Effect.flatMap(OutputPortsRecord, Record.get(id))

// TODO: non contextual variant
export const getOutputPortById = getOutputPortByIdFromContext

/**
 *
 *
 */
export const getPortDeviceStateFromContext = flow(
  // TODO: Check if software synth devices access is present. Having desired
  // port absent in the record doesn't guarantee it's disconnected
  getPortByIdFromContext,
  EffectfulMIDIPort.getDeviceState,
  Effect.orElseSucceed(() => 'disconnected' as const),
)

// TODO: non contextual variant
export const getPortDeviceState = getPortDeviceStateFromContext

/**
 *
 *
 */
export const getPortConnectionStateFromContext = flow(
  getPortByIdFromContext,
  EffectfulMIDIPort.getConnectionState,
)

// TODO: non contextual variant
export const getPortConnectionState = getPortConnectionStateFromContext

/**
 * [MIDIConnectionEvent MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
export const makeMIDIPortStateChangesStream =
  createStreamMakerFrom<MIDIPortEventMap>()(
    is,
    access => ({
      tag: 'MIDIPortStateChange',
      eventListener: { target: asImpl(access)._access, type: 'statechange' },
      spanAttributes: {
        spanTargetName: 'MIDI access handle',
        requestedAccessConfig: asImpl(access)._config,
      },
      nullableFieldName: 'port',
    }),
    rawPort =>
      ({
        newState: rawPort
          ? ({
              ofDevice: rawPort.state,
              ofConnection: rawPort.connection,
            } as const)
          : null,
        port:
          rawPort instanceof MIDIInput
            ? EffectfulMIDIInputPort.make(rawPort)
            : rawPort instanceof MIDIOutput
              ? EffectfulMIDIOutputPort.make(rawPort)
              : null,
      }) as const,
  )

/**
 * @param options Passing a boolean is equivalent to setting `options.capture`
 * property
 */
export const makeMIDIPortStateChangesStreamFromContext = <
  const TOnNullStrategy extends OnNullStrategy = undefined,
>(
  options?: StreamMakerOptions<TOnNullStrategy>,
) => makeMIDIPortStateChangesStream(EffectfulMIDIAccess, options)

export interface SentMessageEffectFromAccess<E = never, R = never>
  extends SentMessageEffectFrom<EffectfulMIDIAccessInstance, E, R> {}

export type TargetPortSelector =
  | 'all existing outputs at effect execution'
  | 'all open connections at effect execution'
  | MIDIPortId
  | MIDIPortId[]

/**
 * beware that it's not possible to ensure the messages will either be all
 * delivered, or all not delivered, as in ACID transactions. There's not even a
 * mechanism to remove a specific message (not all) from the sending queue
 */
export const send: DualSendMIDIMessageFromAccess = dual<
  SendMIDIMessageAccessLast,
  SendMIDIMessageAccessFirst
>(
  polymorphicCheckInDual(is),
  Effect.fn('EffectfulMIDIAccess.send')(
    function* (accessPolymorphic, target, midiMessage, timestamp) {
      const access = yield* fromPolymorphic(accessPolymorphic, is)

      const outputs = yield* getOutputPortsRecord(access)

      if (target === 'all existing outputs at effect execution')
        return yield* pipe(
          Record.values(outputs),
          Effect.forEach(EffectfulMIDIOutputPort.send(midiMessage, timestamp)),
          Effect.as(access),
        )

      if (target === 'all open connections at effect execution')
        return yield* pipe(
          Record.values(outputs),
          // TODO: maybe also do something about pending?
          Effect.filter(EffectfulMIDIPort.isConnectionOpen),
          Effect.flatMap(
            Effect.forEach(
              EffectfulMIDIOutputPort.send(midiMessage, timestamp),
            ),
          ),
          Effect.as(access),
        )

      // TODO: maybe since deviceState returns always connected devices we can
      // simplify this check by applying intersections and comparing lengths

      const portsIdsToSend: MIDIPortId[] = EArray.ensure(target)

      const deviceStatusesEffect = portsIdsToSend.map(id =>
        Option.match(Record.get(outputs, id), {
          onNone: () => Effect.succeed('disconnected' as const),
          onSome: EffectfulMIDIPort.getDeviceState,
        }),
      )

      const deviceStatuses = yield* Effect.all(deviceStatusesEffect)

      if (deviceStatuses.includes('disconnected'))
        return yield* new DisconnectedPortError({
          cause: new DOMException(
            'InvalidStateError',
            // TODO: imitate
            'TODO: imitate there an error thats thrown when the port is disconnected',
          ),
        })

      const sendToSome = (predicate: (id: MIDIPortId) => boolean) =>
        Effect.all(
          Record.reduce(
            outputs,
            [] as EffectfulMIDIOutputPort.SentMessageEffectFromPort<
              never,
              never
            >[],
            // TODO: investigate what the fuck is going on, why the fuck can't I
            // make it a simple expression without either nesting it in
            // curly-braced function body or adding manual type-annotation
            (acc, port, id) =>
              predicate(id)
                ? [
                    ...acc,
                    EffectfulMIDIOutputPort.send(
                      port,
                      midiMessage,
                      timestamp,
                    ) as EffectfulMIDIOutputPort.SentMessageEffectFromPort,
                  ]
                : acc,
          ),
        )

      yield* sendToSome(id => portsIdsToSend.includes(id))

      return access
    },
  ),
)

/**
 *
 *
 */
export const sendFromContext = (...args: SendFromAccessArgs) =>
  Effect.asVoid(send(EffectfulMIDIAccess, ...args))

// TODO: clear by id
// TODO: clear all

export interface DualSendMIDIMessageFromAccess
  extends SendMIDIMessageAccessFirst,
    SendMIDIMessageAccessLast {}

export type SendFromAccessArgs = [
  targetPortSelector: TargetPortSelector,
  ...args: EffectfulMIDIOutputPort.SendFromPortArgs,
]

export interface SendMIDIMessageAccessFirst {
  /**
   *
   *
   */
  <E = never, R = never>(
    accessPolymorphic: PolymorphicEffect<EffectfulMIDIAccessInstance, E, R>,
    ...args: SendFromAccessArgs
  ): SentMessageEffectFromAccess<E, R>
}

export interface SendMIDIMessageAccessLast {
  /**
   *
   *
   */
  (
    ...args: SendFromAccessArgs
  ): {
    /**
     *
     *
     */
    <E = never, R = never>(
      accessPolymorphic: PolymorphicEffect<EffectfulMIDIAccessInstance, E, R>,
    ): SentMessageEffectFromAccess<E, R>
  }
}

/**
 * @param options
 *
 * @returns An Effect representing a request for access to MIDI devices on a
 * user's system. Available only in secure contexts.
 */
export const request = Effect.fn('EffectfulMIDIAccess.request')(function* (
  options?: RequestMIDIAccessOptions,
) {
  yield* Effect.annotateCurrentSpan({ options })

  const rawMIDIAccess = yield* Effect.tryPromise({
    try: () => navigator.requestMIDIAccess(options),
    catch: remapErrorByName(
      {
        AbortError,
        InvalidStateError: UnderlyingSystemError,
        NotSupportedError,
        NotAllowedError,
        // because of https://github.com/WebAudio/web-midi-api/pull/267
        SecurityError: NotAllowedError,
        // For case when navigator doesn't exist
        ReferenceError: NotSupportedError,
        // For case when navigator.requestMIDIAccess is undefined
        TypeError: NotSupportedError,
      },
      'EffectfulMIDIAccess.request error handling absurd',
    ),
  })

  return make(rawMIDIAccess, options)
})
