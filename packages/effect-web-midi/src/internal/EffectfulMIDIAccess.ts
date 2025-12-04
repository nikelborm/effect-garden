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
import { createStreamMakerFrom } from './createStreamMakerFrom.ts'
import * as EffectfulMIDIInputPort from './EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from './EffectfulMIDIOutputPort.ts'
import * as EffectfulMIDIPort from './EffectfulMIDIPort.ts'
import {
  AbortError,
  InvalidStateError,
  NotAllowedError,
  NotSupportedError,
  remapErrorByName,
} from './errors.ts'
import {
  fromIsomorphic,
  type IsomorphicEffect,
  isomorphicCheckInDual,
  type MIDIPortId,
  type SentMessageEffectFrom,
} from './util.ts'

// TODO: add stream of messages sent from this device to target midi device

// TODO: fat service APIs, where all the methods are attached to instance and
// you don't have to constantly write the prefix

/**
 * Unique symbol used for distinguishing {@linkcode EffectfulMIDIAccess}
 * instances from other objects at both runtime and type-level
 * @internal
 */
const TypeId: unique symbol = Symbol.for(
  '@nikelborm/effect-web-midi/EffectfulMIDIAccess',
)

/**
 * Unique symbol used for distinguishing {@linkcode EffectfulMIDIAccess}
 * instances from other objects at both runtime and type-level
 */
export type TypeId = typeof TypeId

// TODO: implement scoping of midi access that will cleanup all message queues
// and streams, and remove listeners

// TODO: implement scope inheritance

// TODO: services for access, input ports map, output ports map, etc

/**
 *
 */
export class Tag extends Context.Tag(
  '@nikelborm/effect-web-midi/EffectfulMIDIAccess/Tag',
)<Tag, EffectfulMIDIAccess>() {}

/**
 *
 * @param config
 * @returns
 */
export const layer = (config?: MIDIOptions) =>
  Layer.effect(Tag, request(config))

/**
 *
 */
export const layerDefault = layer()

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
 * Prototype of all {@linkcode EffectfulMIDIAccess} instances
 * @internal
 */
const Proto = {
  _tag: 'EffectfulMIDIAccess' as const,
  [TypeId]: TypeId,
  [Hash.symbol](this: EffectfulMIDIAccessImpl) {
    return Hash.structure(this._config ?? {})
  },
  [Equal.symbol](that: Equal.Equal) {
    return this === that
  },
  pipe() {
    // biome-ignore lint/complexity/noArguments: Effect's tradition
    return Pipeable.pipeArguments(this, arguments)
  },
  toString(this: EffectfulMIDIAccessImpl) {
    return Inspectable.format(this.toJSON())
  },
  toJSON(this: EffectfulMIDIAccessImpl) {
    return {
      _id: 'EffectfulMIDIAccess',
      config: this._config ?? null,
    }
  },
  [Inspectable.NodeInspectSymbol](this: EffectfulMIDIAccessImpl) {
    return this.toJSON()
  },

  get sysexEnabled() {
    return asImpl(this)._access.sysexEnabled
  },
} satisfies EffectfulMIDIAccess

/**
 * Thin wrapper around {@linkcode MIDIAccess} instance. Will be seen in all of
 * the external code.
 */
export interface EffectfulMIDIAccess
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
interface EffectfulMIDIAccessImpl extends EffectfulMIDIAccess {
  readonly _access: MIDIAccess
  readonly _config: Readonly<MIDIOptions> | undefined
}

/**
 *
 *
 * @internal
 */
const makeImpl = (
  access: MIDIAccess,
  config?: Readonly<MIDIOptions>,
): EffectfulMIDIAccessImpl => {
  const instance = Object.create(Proto)
  instance._access = access
  instance._config = config
  return instance
}

/**
 * Asserts an object to be valid EffectfulMIDIAccess and casts it to internal
 * implementation type
 *
 * @internal
 */
const asImpl = (access: EffectfulMIDIAccess) => {
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
  config?: Readonly<MIDIOptions>,
) => EffectfulMIDIAccess = makeImpl

/**
 *
 *
 * @internal
 */
const isImpl = (access: unknown): access is EffectfulMIDIAccessImpl =>
  typeof access === 'object' &&
  access !== null &&
  Object.getPrototypeOf(access) === Proto &&
  TypeId in access &&
  '_access' in access &&
  typeof access._access === 'object' &&
  '_config' in access &&
  ((typeof access._config === 'object' && access._config !== null) ||
    typeof access._config === 'undefined') &&
  access._access instanceof MIDIAccess

/**
 *
 *
 */
export const is: (access: unknown) => access is EffectfulMIDIAccess = isImpl

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
const decorateToTakeIsomorphicAccessAndReturnRecord =
  <T>(accessor: (access: MIDIAccess) => Iterable<[MIDIPortId, T]>) =>
  <E = never, R = never>(
    accessIsomorphic: IsomorphicEffect<EffectfulMIDIAccess, E, R>,
  ) =>
    Effect.map(
      fromIsomorphic(accessIsomorphic, is),
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
  decorateToTakeIsomorphicAccessAndReturnRecord(getInputPortEntriesFromRaw)

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
  decorateToTakeIsomorphicAccessAndReturnRecord(getOutputPortEntriesFromRaw)

/**
 *
 *
 */
export const getAllPortsRecord = decorateToTakeIsomorphicAccessAndReturnRecord(
  getAllPortsEntriesFromRaw,
)

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
    port =>
      ({
        newState: port
          ? ({ ofDevice: port.state, ofConnection: port.connection } as const)
          : null,
        port:
          port instanceof MIDIInput
            ? EffectfulMIDIInputPort.make(port)
            : port instanceof MIDIOutput
              ? EffectfulMIDIOutputPort.make(port)
              : null,
      }) as const,
  )

// TODO: add a stream to listen for all messages of all currently
// connected inputs, all present inputs, specific input

// TODO: add sinks that will accepts command streams to redirect midi commands
// from something into an actual API

export interface SentMessageEffectFromAccess<E = never, R = never>
  extends SentMessageEffectFrom<EffectfulMIDIAccess, E, R> {}

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
export const send = dual<
  MIDIMessageSenderAccessLast,
  MIDIMessageSenderAccessFirst
>(
  isomorphicCheckInDual(is),
  Effect.fn('EffectfulMIDIAccess.send')(
    function* (accessIsomorphic, target, midiMessage, timestamp) {
      const access = yield* fromIsomorphic(accessIsomorphic, is)

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
        return yield* new InvalidStateError({
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

export interface MIDIMessageSenderAccessFirst {
  /**
   *
   *
   */
  <E = never, R = never>(
    accessIsomorphic: IsomorphicEffect<EffectfulMIDIAccess, E, R>,
    targetPortSelector: TargetPortSelector,
    midiMessage: Iterable<number>,
    timestamp?: DOMHighResTimeStamp,
  ): SentMessageEffectFromAccess<E, R>
}

export interface MIDIMessageSenderAccessLast {
  /**
   *
   *
   */
  (
    targetPortSelector: TargetPortSelector,
    midiMessage: Iterable<number>,
    timestamp?: DOMHighResTimeStamp,
  ): <E = never, R = never>(
    accessIsomorphic: IsomorphicEffect<EffectfulMIDIAccess, E, R>,
  ) => SentMessageEffectFromAccess<E, R>
}

/**
 * @param options
 *
 * @returns An Effect representing a request for access to MIDI devices on a
 * user's system. Available only in secure contexts.
 */
export const request = Effect.fn('EffectfulMIDIAccess.request')(function* (
  options?: MIDIOptions,
) {
  yield* Effect.annotateCurrentSpan({ options })

  const rawMIDIAccess = yield* Effect.tryPromise({
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
      'EffectfulMIDIAccess.request error handling absurd',
    ),
  })

  return make(rawMIDIAccess, options)
})
