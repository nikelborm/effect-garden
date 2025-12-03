/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */
import { Order, pipe, SortedMap } from 'effect'
import * as EArray from 'effect/Array'
// import * as Iterable from 'effect/Iterable'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import { dual, flow } from 'effect/Function'
import * as Hash from 'effect/Hash'
import * as Inspectable from 'effect/Inspectable'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Pipeable from 'effect/Pipeable'
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
import type { MIDIPortId, SentMessageEffectFrom } from './util.ts'

// TODO: add stream of messages sent from this device to target midi device

/**
 * @internal
 */
const TypeId: unique symbol = Symbol.for(
  '@nikelborm/effect-web-midi/EffectfulMIDIAccess',
)

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
 * @returns
 */
export const layerSystemExclusiveSupported = layer({ sysex: true })

/**
 *
 * @returns
 */
export const layerSoftwareSynthSupported = layer({ software: true })

/**
 *
 * @returns
 */
export const layerSystemExclusiveAndSoftwareSynthSupported = layer({
  software: true,
  sysex: true,
})

/**
 * Unique symbol used for distinguishing EffectfulMIDIAccess instances from
 * other objects at both runtime and type-level
 */
export type TypeId = typeof TypeId

/**
 *
 *
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
  // maybe iterate over all ports inputs and outputs?
  // [Symbol.iterator]<K, V>(this: HashMapImpl<K, V>): Iterator<[K, V]> {
  //   return new HashMapIterator(this, (k, v) => [k, v])
  // },
  [Inspectable.NodeInspectSymbol](this: EffectfulMIDIAccessImpl) {
    return this.toJSON()
  },

  get sysexEnabled() {
    return asImpl(this)._access.sysexEnabled
  },
} satisfies EffectfulMIDIAccess

/**
 * Wrapper around {@linkcode MIDIAccess} instances
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
 *
 *
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

/**
 * Unconventional because returns object that changes over time
 * @internal
 */
const makeSortedMapOfPortsUnconventional =
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
  (access: EffectfulMIDIAccess) =>
    pipe(
      asImpl(access)._access[key] as ReadonlyMap<MIDIPortId, TRawMIDIPort>,
      SortedMap.fromIterable(Order.string),
      SortedMap.map(make),
    )

/**
 *
 *
 * @internal
 */
const makeSortedMapOfPorts =
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
  (access: EffectfulMIDIAccess) =>
    Effect.sync(() => makeSortedMapOfPortsUnconventional(key, make)(access))

type ValueOfReadonlyMap<T> = T extends ReadonlyMap<unknown, infer V> ? V : never

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
export const getInputPorts = makeSortedMapOfPorts(
  'inputs',
  EffectfulMIDIInputPort.make,
)

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
export const getOutputPorts = makeSortedMapOfPorts(
  'outputs',
  EffectfulMIDIOutputPort.make,
)

// TODO: all ports
// Maybe use Iterable.appendAll
// export const getPorts =

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

export interface SentMessageEffect<E = never, R = never>
  extends SentMessageEffectFrom<EffectfulMIDIAccess, E, R> {}

type TargetPortSelector =
  | 'all existing outputs at effect execution'
  | 'all open connections at effect execution'
  | MIDIPortId
  | MIDIPortId[]

export interface MIDIMessageSenderFromAccessDataFirst {
  /**
   *
   *
   */
  (
    access: EffectfulMIDIAccess,
    targetPortSelector: TargetPortSelector,
    midiMessage: Iterable<number>,
    timestamp?: DOMHighResTimeStamp,
  ): SentMessageEffect
}

export interface MIDIMessageSenderFromAccessDataLast {
  /**
   *
   *
   */
  (
    targetPortSelector: TargetPortSelector,
    midiMessage: Iterable<number>,
    timestamp?: DOMHighResTimeStamp,
  ): (access: EffectfulMIDIAccess) => SentMessageEffect
}

/**
 * beware that it's not possible to ensure the messages will either be all
 * delivered, or all not delivered, as in ACID transactions. There's not even a
 * mechanism to remove a specific message (not all) from the sending queue
 */
export const send = dual<
  MIDIMessageSenderFromAccessDataLast,
  MIDIMessageSenderFromAccessDataFirst
>(
  is,
  Effect.fn('EffectfulMIDIAccess.send')(
    function* (access, target, midiMessage, timestamp) {
      const outputs = yield* getOutputPorts(access)

      if (target === 'all existing outputs at effect execution')
        return yield* outputs.pipe(
          SortedMap.values,
          Effect.forEach(EffectfulMIDIOutputPort.send(midiMessage, timestamp)),
          Effect.asVoid,
        )

      if (target === 'all open connections at effect execution')
        return yield* outputs.pipe(
          SortedMap.values,
          // TODO: maybe also do something about pending?
          Effect.filter(
            flow(
              EffectfulMIDIPort.getConnectionState,
              Effect.map(state => state === 'open'),
            ),
          ),
          Effect.flatMap(
            Effect.forEach(
              EffectfulMIDIOutputPort.send(midiMessage, timestamp),
            ),
          ),
          Effect.asVoid,
        )

      // TODO: maybe since deviceState returns always connected devices we can
      // simplify this check by applying intersections and comparing lengths

      const portsIdsToSend: MIDIPortId[] = EArray.ensure(target)

      const deviceStatusesEffect = portsIdsToSend.map(id =>
        Option.match(SortedMap.get(outputs, id), {
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
          SortedMap.reduce(
            outputs,
            [] as EffectfulMIDIOutputPort.SentMessageEffect[],
            (acc, port, id) =>
              predicate(id)
                ? [
                    ...acc,
                    EffectfulMIDIOutputPort.send(port, midiMessage, timestamp),
                  ]
                : acc,
          ),
        )

      yield* sendToSome(id => portsIdsToSend.includes(id))
    },
    (self, access) => Effect.as(self, access),
  ),
)

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
