/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as EArray from 'effect/Array'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as EFunction from 'effect/Function'
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
import * as Unify from 'effect/Unify'
import * as Create from './createStreamMakerFrom.ts'
import * as EMIDIInput from './EMIDIInput.ts'
import * as EMIDIOutput from './EMIDIOutput.ts'
import type * as EMIDIPort from './EMIDIPort.ts'
import * as Errors from './errors.ts'
import * as GetPort from './getPortByPortId/getPortByPortIdInContext.ts'
import { isOutputConnectionOpenByPort } from './mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPort.ts'
import { getOutputDeviceStateByPort } from './mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPort.ts'
import * as Util from './util.ts'

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
 * Unique symbol used for distinguishing {@linkcode EMIDIAccessInstance}
 * instances from other objects at both runtime and type-level
 * @internal
 */
const TypeId: unique symbol = Symbol.for(
  '@nikelborm/effect-web-midi/EMIDIAccessInstance',
)

/**
 * Unique symbol used for distinguishing {@linkcode EMIDIAccessInstance}
 * instances from other objects at both runtime and type-level
 */
export type TypeId = typeof TypeId

/**
 * A tag that allows to provide
 * {@linkcode EMIDIAccessInstance|access instance} once with e.g.
 * {@linkcode layer}, {@linkcode layerSystemExclusiveSupported}, etc. and reuse
 * it anywhere, instead of repeatedly {@linkcode request}ing it.
 *
 * The downside of using DI might be that in different places of the app it
 * would be harder to maintain tight MIDI permission scopes.
 *
 * @example
 * ```ts
 * import { EMIDIAccess } from '@nikelborm/effect-web-midi'
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
 *   const access = yield* EMIDIAccess.EMIDIAccess
 *   //    ^ EMIDIAccessInstance
 *
 *   console.log(access.sysexEnabled)
 *   //                 ^ true
 * }).pipe(Effect.provide(EMIDIAccess.layerSystemExclusiveSupported))
 * ```
 *
 * @see `navigator.requestMIDIAccess` {@link https://www.w3.org/TR/webmidi/#dom-navigator-requestmidiaccess|Web MIDI spec}, {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess|MDN reference}
 */
export class EMIDIAccess extends Context.Tag(
  '@nikelborm/effect-web-midi/EMIDIAccess',
)<EMIDIAccess, EMIDIAccessInstance>() {}

export interface RequestMIDIAccessOptions {
  /**
   * This field informs the system whether the ability to send and receive
   * `System Exclusive` messages is requested or allowed on a given
   * {@linkcode EMIDIAccessInstance} object.
   *
   * If this field is set to `true`, but `System Exclusive` support is denied
   * (either by policy or by user action), the access request will fail with a
   * {@linkcode Errors.MIDIAccessNotAllowedError} error.
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
   * given {@linkcode EMIDIAccessInstance} object.
   *
   * If this field is set to `true`, but software synthesizer support is denied
   * (either by policy or by user action), the access request will fail with a
   * {@linkcode Errors.MIDIAccessNotAllowedError} error.
   *
   * If this support is not requested, {@linkcode AllPortsRecord},
   * {@linkcode getInputsRecord}, {@linkcode OutputsRecord}, etc. would
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
 * Prototype of all {@linkcode EMIDIAccessInstance} instances
 * @internal
 */
const Proto = {
  _tag: 'EMIDIAccess' as const,
  [TypeId]: TypeId,
  [Hash.symbol](this: EMIDIAccessImplementationInstance) {
    return Hash.structure(this._config)
  },
  [Equal.symbol](that: Equal.Equal) {
    return this === that
  },
  pipe() {
    // biome-ignore lint/complexity/noArguments: Effect's tradition
    return Pipeable.pipeArguments(this, arguments)
  },
  toString(this: EMIDIAccessImplementationInstance) {
    return Inspectable.format(this.toJSON())
  },
  toJSON(this: EMIDIAccessImplementationInstance) {
    return { _id: 'EMIDIAccess', config: this._config }
  },
  [Inspectable.NodeInspectSymbol](this: EMIDIAccessImplementationInstance) {
    return this.toJSON()
  },

  get sysexEnabled() {
    return assumeImpl(this)._access.sysexEnabled
  },

  get softwareSynthEnabled() {
    return !!assumeImpl(this)._config.software
  },
} satisfies EMIDIAccessInstance

// !!! DOCUMENTATION CURSOR !!!

/**
 * Thin wrapper around {@linkcode MIDIAccess} instance. Will be seen in all the
 * external code.
 */
export interface EMIDIAccessInstance
  extends Equal.Equal,
    Pipeable.Pipeable,
    Inspectable.Inspectable {
  readonly [TypeId]: TypeId
  readonly _tag: 'EMIDIAccess'

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
interface EMIDIAccessImplementationInstance extends EMIDIAccessInstance {
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
): EMIDIAccessImplementationInstance => {
  const instance = Object.create(Proto)
  instance._access = rawAccess
  // TODO: set individual software and sysex flags instead
  instance._config = config ?? {}
  return instance
}

/**
 * Asserts an object to be valid `EMIDIAccess` and casts it to internal
 * implementation type
 *
 * @internal
 */
const assertImpl = (access: unknown) => {
  if (!isImpl(access)) throw new Error('Failed to cast to EMIDIAccess')
  return access
}

/**
 * Asserts an object to be valid `EMIDIAccess`
 *
 * @internal
 */
export const assert: (access: unknown) => EMIDIAccessInstance = assertImpl

/**
 * @internal
 */
export const assumeImpl = (access: EMIDIAccessInstance) =>
  access as EMIDIAccessImplementationInstance

/**
 *
 *
 * @internal
 */
const make: (
  rawAccess: MIDIAccess,
  config?: Readonly<RequestMIDIAccessOptions>,
) => EMIDIAccessInstance = makeImpl

/**
 *
 *
 * @internal
 */
const isImpl = (access: unknown): access is EMIDIAccessImplementationInstance =>
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
export const is: (access: unknown) => access is EMIDIAccessInstance = isImpl

/**
 *
 * @internal
 */
export const resolve = <E = never, R = never>(
  polymorphicAccess: PolymorphicAccessInstance<E, R>,
) => Util.fromPolymorphic(polymorphicAccess, is)

/**
 *
 *
 */
export type PolymorphicAccessInstance<E, R> = Util.PolymorphicEffect<
  EMIDIAccessInstance,
  E,
  R
>

/**
 *
 *
 */
export type PolymorphicAccessInstanceClean = PolymorphicAccessInstance<
  never,
  never
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
    make: (port: TRawMIDIPort) => EMIDIPort.EMIDIPort<TMIDIPortType>,
  ) =>
  (rawAccess: MIDIAccess) =>
    Iterable.map(
      rawAccess[key] as ReadonlyMap<
        Util.MIDIPortId<TMIDIPortType>,
        TRawMIDIPort
      >,
      ([id, raw]) =>
        [
          id as Util.MIDIPortId<TMIDIPortType>,
          make(raw),
        ] satisfies Types.TupleOf<2, unknown>,
    )

/**
 *
 * @internal
 */
const getInputEntriesFromRaw = getPortEntriesFromRawAccess(
  'inputs',
  EMIDIInput.make,
)

/**
 *
 * @internal
 */
const getOutputEntriesFromRaw = getPortEntriesFromRawAccess(
  'outputs',
  EMIDIOutput.make,
)

/**
 *
 * @internal
 */
const getAllPortsEntriesFromRaw = (rawAccess: MIDIAccess) =>
  Iterable.appendAll(
    getInputEntriesFromRaw(rawAccess),
    getOutputEntriesFromRaw(rawAccess),
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
      EFunction.flow(assumeImpl, e => e._access, accessor, Record.fromEntries),
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
export const getInputsRecord = decorateToTakePolymorphicAccessAndReturnRecord(
  getInputEntriesFromRaw,
)

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
export const getOutputsRecord = decorateToTakePolymorphicAccessAndReturnRecord(
  getOutputEntriesFromRaw,
)

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
export const InputsRecord = getInputsRecord(EMIDIAccess)

/**
 *
 *
 */
export const OutputsRecord = getOutputsRecord(EMIDIAccess)

/**
 *
 *
 */
export const AllPortsRecord = getAllPortsRecord(EMIDIAccess)

/**
 * [MIDIConnectionEvent MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
export const makeAllPortsStateChangesStream =
  Create.createStreamMakerFrom<MIDIPortEventMap>()(
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
            ? EMIDIInput.make(rawPort)
            : rawPort instanceof globalThis.MIDIOutput
              ? EMIDIOutput.make(rawPort)
              : null,
      }) as const,
  )

/**
 * beware that it's not possible to ensure the messages will either be all
 * delivered, or all not delivered, as in ACID transactions. There's not even a
 * mechanism to remove a specific message (not all) from the sending queue
 */
export const send: DualSendMIDIMessageFromAccess = EFunction.dual<
  SendMIDIMessageAccessLast,
  SendMIDIMessageAccessFirst
>(
  Util.polymorphicCheckInDual(is),
  Effect.fn('EMIDIAccess.send')(
    function* (polymorphicAccess, target, midiMessage, timestamp) {
      const access = yield* resolve(polymorphicAccess)

      const outputs = yield* getOutputsRecord(access)

      if (target === 'all existing outputs at effect execution')
        return yield* EFunction.pipe(
          Record.values(outputs),
          Effect.forEach(EMIDIOutput.send(midiMessage, timestamp)),
          Effect.as(access),
        )

      if (target === 'all open connections at effect execution')
        return yield* EFunction.pipe(
          Record.values(outputs),
          // TODO: maybe also do something about pending?
          Effect.filter(isOutputConnectionOpenByPort),
          Effect.flatMap(
            Effect.forEach(EMIDIOutput.send(midiMessage, timestamp)),
          ),
          Effect.as(access),
        )

      // TODO: maybe since deviceState returns always connected devices we can
      // simplify this check by applying intersections and comparing lengths

      const portsIdsToSend: Util.MIDIOutputId[] = EArray.ensure(target)

      const deviceStatusesEffect = portsIdsToSend.map(id =>
        EFunction.pipe(
          Record.get(outputs, id),
          Option.match({
            onNone: () => Effect.succeed('disconnected' as const),
            onSome: EFunction.flow(getOutputDeviceStateByPort),
          }),
          effect => Unify.unify(effect),
          Effect.map(state => ({ id, state })),
        ),
      )

      const disconnectedDevice = EArray.findFirst(
        yield* Effect.all(deviceStatusesEffect),
        _ => _.state === 'disconnected',
      )

      if (Option.isSome(disconnectedDevice))
        return yield* new Errors.DisconnectedPortError({
          portId: disconnectedDevice.value.id,
          cause: new DOMException(
            // TODO: make an experiment and paste the error text here
            'TODO: imitate there an error thats thrown when the port is disconnected',
            'InvalidStateError',
          ) as DOMException & { name: 'InvalidStateError' },
        })

      const sendToSome = (predicate: (id: Util.MIDIOutputId) => boolean) =>
        Effect.all(
          Record.reduce(
            outputs,
            [] as EMIDIOutput.SentMessageEffectFromPort<never, never>[],
            // TODO: investigate what the fuck is going on, why the fuck can't I
            // make it a simple expression without either nesting it in
            // curly-braced function body or adding manual type-annotation
            (acc, port, id) =>
              predicate(id)
                ? [
                    ...acc,
                    EMIDIOutput.send(
                      port,
                      midiMessage,
                      timestamp,
                    ) as EMIDIOutput.SentMessageEffectFromPort,
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
export const makeMessagesStreamByInputId = <
  const TOnNullStrategy extends Create.OnNullStrategy = undefined,
>(
  id: Util.MIDIInputId,
  options?: Create.StreamMakerOptions<TOnNullStrategy>,
) =>
  EMIDIInput.makeMessagesStreamByInput(
    GetPort.getInputByPortIdInContext(id),
    options,
  )

// TODO: makeMessagesStreamByInputIdAndAccess
export const makeMessagesStreamByInputIdAndAccess = () => {
  throw new Error('not implemented')
}

/**
 *
 */
export const sendToPortById = (
  id: Util.MIDIOutputId,
  ...args: EMIDIOutput.SendFromPortArgs
) =>
  Effect.asVoid(
    EMIDIOutput.send(GetPort.getOutputByPortIdInContext(id), ...args),
  )

/**
 *
 */
export const clearPortById = EFunction.flow(
  GetPort.getOutputByPortIdInContext,
  EMIDIOutput.clear,
  Effect.asVoid,
)

/**
 * @param options Passing a value of a `boolean` type is equivalent to setting
 * `options.capture` property
 */
export const makeAllPortsStateChangesStreamFromContext = <
  const TOnNullStrategy extends Create.OnNullStrategy = undefined,
>(
  options?: Create.StreamMakerOptions<TOnNullStrategy>,
) => makeAllPortsStateChangesStream(EMIDIAccess, options)

/**
 *
 *
 */
export const sendFromContext = (...args: SendFromAccessArgs) =>
  Effect.asVoid(send(EMIDIAccess, ...args))

/**
 * @param options
 *
 * @returns An Effect representing a request for access to MIDI devices on a
 * user's system. Available only in secure contexts.
 */
export const request = Effect.fn('EMIDIAccess.request')(function* (
  options?: RequestMIDIAccessOptions,
) {
  yield* Effect.annotateCurrentSpan({ options })

  const rawAccess = yield* Effect.tryPromise({
    try: () => navigator.requestMIDIAccess(options),
    catch: Errors.remapErrorByName(
      {
        AbortError: Errors.AbortError,

        InvalidStateError: Errors.UnderlyingSystemError,

        NotAllowedError: Errors.MIDIAccessNotAllowedError,
        // SecurityError is kept for compatibility reason
        // (https://github.com/WebAudio/web-midi-api/pull/267):
        SecurityError: Errors.MIDIAccessNotAllowedError,

        NotSupportedError: Errors.MIDIAccessNotSupportedError,
        // For case when navigator doesn't exist
        ReferenceError: Errors.MIDIAccessNotSupportedError,
        // For case when navigator.requestMIDIAccess is undefined
        TypeError: Errors.MIDIAccessNotSupportedError,
      },
      'EMIDIAccess.request error handling absurd',
      { whileAskingForPermissions: options ?? {} },
    ),
  })

  // TODO: finish this

  const ref = yield* Ref.make(
    SortedMap.empty<Util.MIDIBothPortId, MIDIPortType>(Order.string),
  )

  // return make(rawAccess, options, ref)
  return make(rawAccess, options)
})

// TODO: clear all outputs

/**
 *
 * **Errors:**
 *
 * - {@linkcode Errors.AbortError} Argument x must be non-zero
 * - {@linkcode Errors.UnderlyingSystemError} Argument x must be non-zero
 * - {@linkcode Errors.MIDIAccessNotSupportedError} Argument x must be non-zero
 * - {@linkcode Errors.MIDIAccessNotAllowedError} Argument x must be non-zero
 *
 * @param config
 * @returns
 */
export const layer = (config?: RequestMIDIAccessOptions) =>
  Layer.effect(EMIDIAccess, request(config))

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
  extends Util.SentMessageEffectFrom<EMIDIAccessInstance, E, R> {}

export type TargetPortSelector =
  | 'all existing outputs at effect execution'
  | 'all open connections at effect execution'
  | Util.MIDIOutputId
  | Util.MIDIOutputId[]

export interface DualSendMIDIMessageFromAccess
  extends SendMIDIMessageAccessFirst,
    SendMIDIMessageAccessLast {}

export type SendFromAccessArgs = [
  targetPortSelector: TargetPortSelector,
  ...args: EMIDIOutput.SendFromPortArgs,
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

export interface GetThingByPortId<
  TSuccess,
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessFirst<
      TSuccess,
      TTypeOfPortId,
      TAccessGettingFallbackError,
      TAccessGettingFallbackRequirement,
      TAdditionalError,
      TAdditionalRequirement
    >,
    GetThingByPortIdAccessLast<
      TSuccess,
      TTypeOfPortId,
      TAccessGettingFallbackError,
      TAccessGettingFallbackRequirement,
      TAdditionalError,
      TAdditionalRequirement
    > {}

export interface GetThingByPortIdAccessFirst<
  TSuccess,
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> {
  /**
   *
   *
   */
  <TAccessGettingError = never, TAccessGettingRequirement = never>(
    polymorphicAccess: PolymorphicAccessInstance<
      TAccessGettingError,
      TAccessGettingRequirement
    >,
    portId: Util.MIDIPortId<TTypeOfPortId>,
  ): AcquiredThing<
    TSuccess,
    TAccessGettingError,
    TAccessGettingRequirement,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  >
}

export interface GetThingByPortIdAccessLast<
  TSuccess,
  TTypeOfPortId extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> {
  /**
   *
   *
   */
  (
    portId: Util.MIDIPortId<TTypeOfPortId>,
  ): GetThingByPortIdAccessLastSecondHalf<
    TSuccess,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  >
}

export interface GetThingByPortIdAccessLastSecondHalf<
  TSuccess,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> {
  /**
   *
   *
   */
  <TAccessGettingError = never, TAccessGettingRequirement = never>(
    polymorphicAccess: PolymorphicAccessInstance<
      TAccessGettingError,
      TAccessGettingRequirement
    >,
  ): AcquiredThing<
    TSuccess,
    TAccessGettingError,
    TAccessGettingRequirement,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  >
}

export interface AcquiredThing<
  TSuccess,
  TAccessGettingError,
  TAccessGettingRequirement,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends Effect.Effect<
    TSuccess,
    | Util.FallbackOnUnknownOrAny<
        TAccessGettingError,
        TAccessGettingFallbackError
      >
    | TAdditionalError,
    | Util.FallbackOnUnknownOrAny<
        TAccessGettingRequirement,
        TAccessGettingFallbackRequirement
      >
    | TAdditionalRequirement
  > {}
