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
import * as Order from 'effect/Order'
import * as Pipeable from 'effect/Pipeable'
import * as Record from 'effect/Record'
import * as Ref from 'effect/Ref'
import * as SortedMap from 'effect/SortedMap'
import type * as Types from 'effect/Types'
import {
  getInputPortByPortIdInContext,
  getOutputPortByPortIdInContext,
} from './contextualFunctions/getPortByPortId/getPortByPortIdInContext.ts'
import { isOutputPortConnectionOpenByPort } from './contextualFunctions/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPort.ts'
import { getOutputPortDeviceStateByPort } from './contextualFunctions/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPort.ts'
import type {
  OnNullStrategy,
  StreamMakerOptions,
} from './createStreamMakerFrom.ts'
import { createStreamMakerFrom } from './createStreamMakerFrom.ts'
import * as EffectfulMIDIInputPort from './EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from './EffectfulMIDIOutputPort.ts'
import type * as EffectfulMIDIPort from './EffectfulMIDIPort.ts'
import {
  AbortError,
  DisconnectedPortError,
  MIDIAccessNotAllowedError,
  MIDIAccessNotSupportedError,
  remapErrorByName,
  UnderlyingSystemError,
} from './errors.ts'
import {
  fromPolymorphic,
  type MIDIBothPortId,
  type MIDIInputPortId,
  type MIDIOutputPortId,
  type MIDIPortId,
  type PolymorphicEffect,
  polymorphicCheckInDual,
  type SentMessageEffectFrom,
} from './util.ts'

// TODO: add stream of messages sent from this device to target midi device

// TODO: fat service APIs, where all the methods are attached to instance and
// where you don't have to constantly write the prefix

// TODO: implement scoping of midi access that will clean up all message queues
// and streams, and remove listeners

// TODO: implement scope inheritance

// TODO: make a Ref with a port map that would be automatically updated by
// listening to the stream of connection events?

// TODO: add a stream to listen for all messages of all currently
// connected inputs, all present inputs, specific input

// TODO: add sinks that will accept command streams to redirect midi commands
// from something into an actual API

// TODO: add effect to wait until connected by port ID

// TODO: reflect sysex and software flags in type-system

// TODO: make matchers that support returning effects from the callback instead of plain values

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
 * {@linkcode layer}, {@linkcode layerSystemExclusiveSupported}, etc. and reuse
 * it anywhere, instead of repeatedly {@linkcode request}ing it.
 *
 * The downside of using DI might be that in different places of the app it
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
 *   //      | AbortError
 *   //      | UnderlyingSystemError
 *   //      | MIDIAccessNotAllowedError
 *   //      | MIDIAccessNotSupportedError
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
 * @see `navigator.requestMIDIAccess` {@link https://www.w3.org/TR/webmidi/#dom-navigator-requestmidiaccess|Web MIDI spec}, {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess|MDN reference}
 */
export class EffectfulMIDIAccess extends Context.Tag(
  '@nikelborm/effect-web-midi/EffectfulMIDIAccess',
)<EffectfulMIDIAccess, EffectfulMIDIAccessInstance>() {}

export interface RequestMIDIAccessOptions {
  /**
   * This field informs the system whether the ability to send and receive
   * `System Exclusive` messages is requested or allowed on a given
   * {@linkcode EffectfulMIDIAccessInstance} object.
   *
   * If this field is set to `true`, but `System Exclusive` support is denied
   * (either by policy or by user action), the access request will fail with a
   * {@linkcode MIDIAccessNotAllowedError} error.
   *
   * If this support is not requested (and allowed), the system will throw
   * exceptions if the user tries to send `System Exclusive` messages, and will
   * silently mask out any `System Exclusive` messages received on the port.
   *
   * @default false
   * @see {@link https://www.w3.org/TR/webmidi/#dom-midioptions-sysex|Web MIDI spec}, {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess#sysex|MDN reference}
   */
  readonly sysex?: boolean

  /**
   * This field informs the system whether the ability to utilize any software
   * synthesizers installed in the host system is requested or allowed on a
   * given {@linkcode EffectfulMIDIAccessInstance} object.
   *
   * If this field is set to `true`, but software synthesizer support is denied
   * (either by policy or by user action), the access request will fail with a
   * {@linkcode MIDIAccessNotAllowedError} error.
   *
   * If this support is not requested, {@linkcode AllPortsRecord},
   * {@linkcode getInputPortsRecord}, {@linkcode OutputPortsRecord}, etc. would
   * not include any software synthesizers.
   *
   * Note that may result in a two-step request procedure if software
   * synthesizer support is desired but not required - software synthesizers may
   * be disabled when MIDI hardware device access is allowed.
   *
   * @default false
   * @see {@link https://www.w3.org/TR/webmidi/#dom-midioptions-software|Web MIDI spec}, {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess#software|MDN reference}
   */
  readonly software?: boolean
}

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
    return assumeImpl(this)._access.sysexEnabled
  },

  get softwareSynthEnabled() {
    return !!assumeImpl(this)._config.software
  },
} satisfies EffectfulMIDIAccessInstance

// !!! DOCUMENTATION CURSOR !!!

/**
 * Thin wrapper around {@linkcode MIDIAccess} instance. Will be seen in all the
 * external code.
 */
export interface EffectfulMIDIAccessInstance
  extends Equal.Equal,
    Pipeable.Pipeable,
    Inspectable.Inspectable {
  readonly [TypeId]: TypeId
  readonly _tag: 'EffectfulMIDIAccess'

  /**
   * The **`sysexEnabled`** read-only property of the MIDIAccess interface indicates whether system exclusive support is enabled on the current MIDIAccess instance.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MIDIAccess/sysexEnabled)
   */
  readonly sysexEnabled: boolean

  readonly softwareSynthEnabled: boolean
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
  rawAccess: MIDIAccess,
  config?: Readonly<RequestMIDIAccessOptions>,
): EffectfulMIDIAccessImplementationInstance => {
  const instance = Object.create(Proto)
  instance._access = rawAccess
  // TODO: set individual software and sysex flags instead
  instance._config = config ?? {}
  return instance
}

/**
 * Asserts an object to be valid `EffectfulMIDIAccess` and casts it to internal
 * implementation type
 *
 * @internal
 */
const assertImpl = (access: unknown) => {
  if (!isImpl(access)) throw new Error('Failed to cast to EffectfulMIDIAccess')
  return access
}

/**
 * Asserts an object to be valid `EffectfulMIDIAccess`
 *
 * @internal
 */
export const assert: (access: unknown) => EffectfulMIDIAccessInstance =
  assertImpl

/**
 * @internal
 */
export const assumeImpl = (access: EffectfulMIDIAccessInstance) =>
  access as EffectfulMIDIAccessImplementationInstance

/**
 *
 *
 * @internal
 */
const make: (
  rawAccess: MIDIAccess,
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

/**
 *
 * @internal
 */
export const resolve = <E = never, R = never>(
  polymorphicAccess: PolymorphicAccessInstance<E, R>,
) => fromPolymorphic(polymorphicAccess, is)

/**
 *
 *
 */
export type PolymorphicAccessInstance<E = never, R = never> = PolymorphicEffect<
  EffectfulMIDIAccessInstance,
  E,
  R
>

/**
 *
 *
 */
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
  >(
    key: TMIDIAccessObjectKey,
    make: (
      port: TRawMIDIPort,
    ) => EffectfulMIDIPort.EffectfulMIDIPort<TMIDIPortType>,
  ) =>
  (rawAccess: MIDIAccess) =>
    Iterable.map(
      rawAccess[key] as ReadonlyMap<MIDIPortId<TMIDIPortType>, TRawMIDIPort>,
      ([id, raw]) =>
        [id as MIDIPortId<TMIDIPortType>, make(raw)] satisfies Types.TupleOf<
          2,
          unknown
        >,
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
const getAllPortsEntriesFromRaw = (rawAccess: MIDIAccess) =>
  Iterable.appendAll(
    getInputPortEntriesFromRaw(rawAccess),
    getOutputPortEntriesFromRaw(rawAccess),
  )

/**
 *
 * @param accessor
 * @returns
 * @internal
 */
const decorateToTakePolymorphicAccessAndReturnRecord =
  <T extends [string, unknown]>(
    accessor: (rawAccess: MIDIAccess) => Iterable<T>,
  ) =>
  <E = never, R = never>(polymorphicAccess: PolymorphicAccessInstance<E, R>) =>
    Effect.map(
      resolve(polymorphicAccess),
      flow(assumeImpl, e => e._access, accessor, Record.fromEntries),
    ) as Effect.Effect<
      Types.UnionToIntersection<T extends unknown ? Record<T[0], T[1]> : never>,
      E,
      R
    >

/**
 * Because `MIDIInputMap` can potentially be a mutable object, meaning new
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
 * Because `MIDIOutputMap` can potentially be a mutable object, meaning new
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
 * [MIDIConnectionEvent MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
export const makeAllPortsStateChangesStream =
  createStreamMakerFrom<MIDIPortEventMap>()(
    is,
    access => ({
      tag: 'MIDIPortStateChange',
      eventListener: {
        target: assumeImpl(access)._access,
        type: 'statechange',
      },
      spanAttributes: {
        spanTargetName: 'MIDI access handle',
        requestedAccessConfig: assumeImpl(access)._config,
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
          rawPort instanceof globalThis.MIDIInput
            ? EffectfulMIDIInputPort.make(rawPort)
            : rawPort instanceof globalThis.MIDIOutput
              ? EffectfulMIDIOutputPort.make(rawPort)
              : null,
      }) as const,
  )

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
    function* (polymorphicAccess, target, midiMessage, timestamp) {
      const access = yield* resolve(polymorphicAccess)

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
          Effect.filter(isOutputPortConnectionOpenByPort),
          Effect.flatMap(
            Effect.forEach(
              EffectfulMIDIOutputPort.send(midiMessage, timestamp),
            ),
          ),
          Effect.as(access),
        )

      // TODO: maybe since deviceState returns always connected devices we can
      // simplify this check by applying intersections and comparing lengths

      const portsIdsToSend: MIDIOutputPortId[] = EArray.ensure(target)

      const deviceStatusesEffect = portsIdsToSend.map(id =>
        Option.match(Record.get(outputs, id), {
          onNone: () => Effect.succeed('disconnected' as const),
          onSome: getOutputPortDeviceStateByPort,
        }),
      )

      const deviceStatuses = yield* Effect.all(deviceStatusesEffect)

      if (deviceStatuses.includes('disconnected'))
        return yield* new DisconnectedPortError({
          cause: new DOMException(
            'InvalidStateError',
            // TODO: make an experiment and paste the error text here
            'TODO: imitate there an error thats thrown when the port is disconnected',
          ),
        })

      const sendToSome = (predicate: (id: MIDIOutputPortId) => boolean) =>
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
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makeMessagesStreamByPortId = <
  const TOnNullStrategy extends OnNullStrategy = undefined,
>(
  id: MIDIInputPortId,
  options?: StreamMakerOptions<TOnNullStrategy>,
) =>
  EffectfulMIDIInputPort.makeMessagesStream(
    getInputPortByPortIdInContext(id),
    options,
  )

/**
 *
 */
export const sendToPortById = (
  id: MIDIOutputPortId,
  ...args: EffectfulMIDIOutputPort.SendFromPortArgs
) =>
  Effect.asVoid(
    EffectfulMIDIOutputPort.send(getOutputPortByPortIdInContext(id), ...args),
  )

/**
 *
 */
export const clearPortById = flow(
  getOutputPortByPortIdInContext,
  EffectfulMIDIOutputPort.clear,
  Effect.asVoid,
)

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makeAllPortsStateChangesStreamFromContext = <
  const TOnNullStrategy extends OnNullStrategy = undefined,
>(
  options?: StreamMakerOptions<TOnNullStrategy>,
) => makeAllPortsStateChangesStream(EffectfulMIDIAccess, options)

/**
 *
 *
 */
export const sendFromContext = (...args: SendFromAccessArgs) =>
  Effect.asVoid(send(EffectfulMIDIAccess, ...args))

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

  const rawAccess = yield* Effect.tryPromise({
    try: () => navigator.requestMIDIAccess(options),
    catch: remapErrorByName(
      {
        AbortError,

        InvalidStateError: UnderlyingSystemError,

        NotAllowedError: MIDIAccessNotAllowedError,
        // Kept for compatibility reason (https://github.com/WebAudio/web-midi-api/pull/267):
        SecurityError: MIDIAccessNotAllowedError,

        NotSupportedError: MIDIAccessNotSupportedError,
        // For case when navigator doesn't exist
        ReferenceError: MIDIAccessNotSupportedError,
        // For case when navigator.requestMIDIAccess is undefined
        TypeError: MIDIAccessNotSupportedError,
      },
      'EffectfulMIDIAccess.request error handling absurd',
    ),
  })

  // TODO: finish this

  const ref = yield* Ref.make(
    SortedMap.empty<MIDIBothPortId, MIDIPortType>(Order.string),
  )

  // return make(rawAccess, options, ref)
  return make(rawAccess, options)
})

// TODO: clear all outputs

/**
 *
 * **Errors:**
 *
 * - {@linkcode AbortError} Argument x must be non-zero
 * - {@linkcode UnderlyingSystemError} Argument x must be non-zero
 * - {@linkcode MIDIAccessNotSupportedError} Argument x must be non-zero
 * - {@linkcode MIDIAccessNotAllowedError} Argument x must be non-zero
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

export interface SentMessageEffectFromAccess<E = never, R = never>
  extends SentMessageEffectFrom<EffectfulMIDIAccessInstance, E, R> {}

export type TargetPortSelector =
  | 'all existing outputs at effect execution'
  | 'all open connections at effect execution'
  | MIDIOutputPortId
  | MIDIOutputPortId[]

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
    polymorphicAccess: PolymorphicAccessInstance<E, R>,
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
      polymorphicAccess: PolymorphicAccessInstance<E, R>,
    ): SentMessageEffectFromAccess<E, R>
  }
}
