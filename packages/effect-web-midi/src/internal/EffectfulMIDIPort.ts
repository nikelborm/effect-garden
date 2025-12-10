/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */
import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import { dual, flow } from 'effect/Function'
import * as Hash from 'effect/Hash'
import * as Inspectable from 'effect/Inspectable'
import * as Pipeable from 'effect/Pipeable'
import * as Record from 'effect/Record'
import {
  type BuiltStream,
  createStreamMakerFrom,
  type OnNullStrategy,
  type StreamMakerOptions,
} from './createStreamMakerFrom.ts'
import { remapErrorByName, UnavailablePortError } from './errors.ts'
import {
  fromPolymorphic,
  getStaticMIDIPortInfo,
  MIDIBothPortId,
  type MIDIPortId,
  type PolymorphicEffect,
  polymorphicCheckInDual,
} from './util.ts'

/**
 * Unique symbol used for distinguishing {@linkcode EffectfulMIDIPort} instances
 * from other objects at both runtime and type-level
 * @internal
 */
const TypeId: unique symbol = Symbol.for(
  '@nikelborm/effect-web-midi/EffectfulMIDIPort',
)

/**
 * Unique symbol used for distinguishing {@linkcode EffectfulMIDIPort} instances
 * from other objects at both runtime and type-level
 */
export type TypeId = typeof TypeId

/**
 * Prototype of all {@linkcode EffectfulMIDIPort} instances
 * @internal
 */
const CommonProto = {
  _tag: 'EffectfulMIDIPort' as const,

  [TypeId]: TypeId,

  [Hash.symbol](this: EffectfulMIDIPortImpl) {
    return Hash.string(this.id)
  },

  [Equal.symbol](this: EffectfulMIDIPortImpl, that: Equal.Equal) {
    return 'id' in that && this.id === that.id
  },

  pipe() {
    // biome-ignore lint/complexity/noArguments: Effect's tradition
    return Pipeable.pipeArguments(this, arguments)
  },

  toString(this: EffectfulMIDIPortImpl) {
    return Inspectable.format(this.toJSON())
  },

  toJSON(this: EffectfulMIDIPortImpl) {
    return {
      _id: 'EffectfulMIDIPort',
      id: this.id,
      name: this.name,
      manufacturer: this.manufacturer,
      version: this.version,
      type: this.type,
    }
  },

  [Inspectable.NodeInspectSymbol](this: EffectfulMIDIPortImpl) {
    return this.toJSON()
  },

  get id() {
    return MIDIBothPortId(assumeImpl(this)._port.id)
  },
  get name() {
    return assumeImpl(this)._port.name
  },
  get manufacturer() {
    return assumeImpl(this)._port.manufacturer
  },
  get version() {
    return assumeImpl(this)._port.version
  },
  get type() {
    return assumeImpl(this)._port.type
  },
} satisfies EffectfulMIDIPort

/**
 * Thin wrapper around {@linkcode MIDIPort} instance. Will be seen in all of
 * the external code.
 */
export interface EffectfulMIDIPort<
  TMIDIPortType extends MIDIPortType = MIDIPortType,
> extends Equal.Equal,
    Pipeable.Pipeable,
    Inspectable.Inspectable,
    Pick<MIDIPort, 'version' | 'name' | 'manufacturer'> {
  /**
   * The **`id`** read-only property of the MIDIPort interface returns the unique ID of the port.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/id)
   */
  readonly id: MIDIPortId<TMIDIPortType>
  readonly [TypeId]: TypeId
  readonly _tag: 'EffectfulMIDIPort'
  readonly type: TMIDIPortType
}

/**
 * Thin wrapper around {@linkcode MIDIPort} instance giving access to the
 * actual field storing it.
 * @internal
 */
export interface EffectfulMIDIPortImpl<
  TPort extends MIDIPort = MIDIPort,
  TType extends MIDIPortType = MIDIPortType,
> extends EffectfulMIDIPort<TType> {
  readonly _port: TPort
}

/**
 *
 *
 * @internal
 */
export const makeImpl = <TPort extends MIDIPort, TType extends MIDIPortType>(
  port: NoInfer<TPort>,
  type: TType,
  ClassToAssertInheritance: new (...args: unknown[]) => TPort,
): EffectfulMIDIPortImpl<TPort, TType> => {
  if (port.type !== type || !(port instanceof ClassToAssertInheritance))
    throw new Error(`EffectfulMIDIPort constructor accepts only ${type} ports`)

  const instance = Object.create(CommonProto)
  instance._port = port
  return instance
}

/**
 * Asserts an object to be valid EffectfulMIDIPort and casts it to internal
 * implementation type
 *
 * @internal
 */
const assertImpl = (port: unknown) => {
  if (!isGeneralImpl(port))
    throw new Error('Failed to cast to EffectfulMIDIPort')
  return port
}

/**
 * Asserts an object to be valid EffectfulMIDIPort
 */
export const assert: (port: unknown) => EffectfulMIDIPort = assertImpl

/**
 * @internal
 */
const assumeImpl = (port: EffectfulMIDIPort) => port as EffectfulMIDIPortImpl

/**
 *
 *
 * @internal
 */
const isGeneralImpl = (port: unknown): port is EffectfulMIDIPortImpl =>
  typeof port === 'object' &&
  port !== null &&
  Object.getPrototypeOf(port) === CommonProto &&
  TypeId in port &&
  'type' in port &&
  '_port' in port &&
  typeof port._port === 'object' &&
  port._port instanceof MIDIPort

/**
 *
 *
 * @internal
 */
export const isImplOfSpecificType =
  <const TType extends MIDIPortType, TPort extends MIDIPort>(
    type: TType,
    ClassToAssertInheritance: new (...args: unknown[]) => TPort,
  ) =>
  (port: unknown): port is EffectfulMIDIPortImpl<TPort, TType> => {
    if (!ClassToAssertInheritance)
      throw new Error(
        'Called in a context where ClassToAssertInheritance is falsy, probably on a platform where MIDI APIs are not supported, like node.js or bun',
      )

    return (
      isGeneralImpl(port) &&
      port.type === type &&
      port._port instanceof ClassToAssertInheritance
    )
  }

/**
 *
 *
 */
export const is: (port: unknown) => port is EffectfulMIDIPort = isGeneralImpl

/**
 * @internal
 * @returns An effect with the same port for easier chaining of operations
 */
const callMIDIPortMethod = <TError = never>(
  method: 'close' | 'open',
  mapError: (err: unknown) => TError,
) =>
  Effect.fn(`EffectfulMIDIPort.${method}`)(function* <
    TType extends MIDIPortType,
    E = never,
    R = never,
  >(polymorphicPort: PolymorphicEffect<EffectfulMIDIPort<TType>, E, R>) {
    const port = yield* fromPolymorphic(polymorphicPort, is)

    yield* Effect.annotateCurrentSpan({
      method,
      port: getStaticMIDIPortInfo(port),
    })

    yield* Effect.tryPromise({
      try: () => assumeImpl(port)._port[method](),
      catch: mapError,
    })

    return port
  })

/**
 * @returns An effect with the same port for easier chaining of operations
 */
export const openConnection = callMIDIPortMethod(
  'open',
  remapErrorByName(
    {
      NotAllowedError: UnavailablePortError,
      // Kept for compatibility reason (https://github.com/WebAudio/web-midi-api/pull/278):
      InvalidAccessError: UnavailablePortError,

      InvalidStateError: UnavailablePortError,
    },
    'MIDI port open error handling absurd',
  ),
)

/**
 * @returns An effect with the same port for easier chaining of operations
 */
export const closeConnection = callMIDIPortMethod('close', err => {
  throw err
})

/**
 * @returns An effect with the same port for easier chaining of operations
 */
export const acquireReleaseConnection = <
  TType extends MIDIPortType,
  E = never,
  R = never,
>(
  port: PolymorphicEffect<EffectfulMIDIPort<TType>, E, R>,
) => Effect.acquireRelease(openConnection(port), closeConnection)

/**
 * Function to create a stream of remapped {@linkcode MIDIConnectionEvent}s
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
export const makeStateChangesStream = createStreamMakerFrom<MIDIPortEventMap>()(
  is,
  port => ({
    tag: 'MIDIPortStateChange',
    eventListener: { target: assumeImpl(port)._port, type: 'statechange' },
    spanAttributes: {
      spanTargetName: 'MIDI port',
      port: getStaticMIDIPortInfo(port),
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
    }) as const,
) as DualMakeStateChangesStream

/**
 * @internal
 */
const getValueInRawPortFieldUnsafe =
  <const TMIDIPortMutableProperty extends MIDIPortMutableProperty>(
    property: TMIDIPortMutableProperty,
  ) =>
  (port: EffectfulMIDIPort) =>
    assumeImpl(port)._port[property]

/**
 * @internal
 */
const getMutableProperty =
  <const TMIDIPortMutableProperty extends MIDIPortMutableProperty>(
    property: TMIDIPortMutableProperty,
  ) =>
  <E = never, R = never>(
    polymorphicPort: PolymorphicEffect<EffectfulMIDIPort, E, R>,
  ) =>
    Effect.isEffect(polymorphicPort)
      ? Effect.map(polymorphicPort, getValueInRawPortFieldUnsafe(property))
      : Effect.sync(() =>
          getValueInRawPortFieldUnsafe(property)(polymorphicPort),
        )

/**
 * @returns A state of the hardware connection between the OS and the device
 * ({@linkcode MIDIPortDeviceState}). Because it can change over time, it's
 * wrapped in effect. It's taken from the {@linkcode MIDIPort.state|state}
 * read-only property of the {@linkcode MIDIPort} interface ([MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/state)).
 */
export const getDeviceState = getMutableProperty('state')

/**
 * @returns A state of the connection between the browser's tab and OS
 * abstraction of the device ({@linkcode MIDIPortConnectionState}). Because it
 * can change over time, it's wrapped in effect. It's taken from the
 * {@linkcode MIDIPort.connection|connection} read-only property of the
 * {@linkcode MIDIPort} interface ([MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/connection)).
 */
export const getConnectionState = getMutableProperty('connection')

/**
 *
 */
export const isDeviceConnected = flow(
  getDeviceState,
  Effect.map(e => e === 'connected'),
)

/**
 *
 */
export const isDeviceDisconnected = flow(
  getDeviceState,
  Effect.map(e => e === 'disconnected'),
)

/**
 *
 */
export const isConnectionOpen = flow(
  getConnectionState,
  Effect.map(e => e === 'open'),
)

/**
 *
 */
export const isConnectionPending = flow(
  getConnectionState,
  Effect.map(e => e === 'pending'),
)

/**
 *
 */
export const isConnectionClosed = flow(
  getConnectionState,
  Effect.map(e => e === 'closed'),
)

/**
 * @internal
 */
export const matchMutableMIDIPortProperty = <
  const TMIDIPortProperty extends MIDIPortMutableProperty,
  TMIDIPortTypeHighLevelRestriction extends MIDIPortType,
>(
  property: TMIDIPortProperty,
  is: (
    port: unknown,
  ) => port is EffectfulMIDIPort<TMIDIPortTypeHighLevelRestriction>,
): DualMatchPortState<TMIDIPortTypeHighLevelRestriction, TMIDIPortProperty> =>
  dual<
    MatchStatePortLast<TMIDIPortTypeHighLevelRestriction, TMIDIPortProperty>,
    MatchStatePortFirst<TMIDIPortTypeHighLevelRestriction, TMIDIPortProperty>
  >(
    polymorphicCheckInDual(is),
    Effect.fn(function* (polymorphicPort, config) {
      const port = yield* fromPolymorphic(polymorphicPort, is)

      const state = getValueInRawPortFieldUnsafe(property)(port)

      for (const [stateCase, stateCallback] of Record.toEntries(config))
        if (state === stateCase)
          return (stateCallback as PortStateHandler)(port)

      return yield* Effect.dieMessage(
        `AssertionFailed: Missing handler for "${state}" state inside "${property}" property`,
      )
    }),
  )

/**
 *
 */
export const matchConnectionState = matchMutableMIDIPortProperty(
  'connection',
  is,
)

/**
 *
 */
export const matchDeviceState = matchMutableMIDIPortProperty('state', is)

export interface PortStateHandler {
  // biome-ignore lint/suspicious/noExplicitAny: <There's no better way to type>
  (port: EffectfulMIDIPort): any
}
export interface MatcherConfigPlain extends Record<string, PortStateHandler> {}

export interface MatchResult<TActualConf extends MatcherConfigPlain, E, R>
  extends Effect.Effect<ReturnType<TActualConf[keyof TActualConf]>, E, R> {}

export interface DualMatchPortState<
  TMIDIPortTypeHighLevelRestriction extends MIDIPortType,
  TMIDIPortProperty extends MIDIPortMutableProperty,
> extends MatchStatePortLast<
      TMIDIPortTypeHighLevelRestriction,
      TMIDIPortProperty
    >,
    MatchStatePortFirst<TMIDIPortTypeHighLevelRestriction, TMIDIPortProperty> {}

export interface MatchStatePortFirst<
  TMIDIPortTypeHighLevelRestriction extends MIDIPortType,
  TMIDIPortProperty extends MIDIPortMutableProperty,
> {
  /**
   * Description placeholder
   *
   * @param polymorphicPort
   * @param stateCaseToHandlerMap
   * @returns
   */
  <
    TStateCaseToHandlerMap extends StateCaseToHandlerMap<
      TMIDIPortProperty,
      TMIDIPortTypeHighLevelRestriction,
      TStateCaseToHandlerMap
    >,
    E = never,
    R = never,
  >(
    polymorphicPort: PolymorphicEffect<
      EffectfulMIDIPort<TMIDIPortTypeHighLevelRestriction>,
      E,
      R
    >,
    stateCaseToHandlerMap: TStateCaseToHandlerMap,
  ): MatchResult<TStateCaseToHandlerMap, E, R>
}

export interface MatchStatePortLast<
  TMIDIPortTypeHighLevelRestriction extends MIDIPortType,
  TMIDIPortProperty extends MIDIPortMutableProperty,
> {
  /**
   * Description placeholder
   *
   * @param stateCaseToHandlerMap
   * @returns
   */
  <
    TStateCaseToHandlerMap extends StateCaseToHandlerMap<
      TMIDIPortProperty,
      TMIDIPortTypeHighLevelRestriction,
      TStateCaseToHandlerMap
    >,
  >(
    stateCaseToHandlerMap: TStateCaseToHandlerMap,
  ): {
    /**
     * Description placeholder
     *
     * @param polymorphicPort
     * @returns
     */
    <E = never, R = never>(
      polymorphicPort: PolymorphicEffect<
        EffectfulMIDIPort<TMIDIPortTypeHighLevelRestriction>,
        E,
        R
      >,
    ): MatchResult<TStateCaseToHandlerMap, E, R>
  }
}

export type StateCaseToHandlerMap<
  TMIDIPortProperty extends MIDIPortMutableProperty,
  TMIDIPortType extends MIDIPortType,
  TConfigSelf,
> = {
  readonly [StateCase in MIDIPort[TMIDIPortProperty]]: (
    port: EffectfulMIDIPort<TMIDIPortType>,
    // biome-ignore lint/suspicious/noExplicitAny: <There's no preciser type>
  ) => any
} & {
  readonly [RedundantValueCaseHandling in Exclude<
    keyof TConfigSelf,
    MIDIPort[TMIDIPortProperty]
  >]: never
}

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface StateChangesStream<
  TOnNullStrategy extends OnNullStrategy,
  TType extends MIDIPortType,
  E = never,
  R = never,
> extends BuiltStream<
    'MIDIPortStateChange',
    EffectfulMIDIPort<TType>,
    {
      readonly newState: {
        readonly ofDevice: MIDIPortDeviceState
        readonly ofConnection: MIDIPortConnectionState
      } | null
    },
    TOnNullStrategy,
    E,
    R
  > {}

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface DualMakeStateChangesStream<
  THighLevelTypeRestriction extends MIDIPortType = MIDIPortType,
> extends MakeStateChangesStreamPortFirst<THighLevelTypeRestriction>,
    MakeStateChangesStreamPortLast<THighLevelTypeRestriction> {}

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface MakeStateChangesStreamPortFirst<
  THighLevelTypeRestriction extends MIDIPortType = MIDIPortType,
> {
  /**
   * @param options Passing a boolean is equivalent to setting `options.capture`
   * property
   */
  <
    TType extends THighLevelTypeRestriction,
    const TOnNullStrategy extends OnNullStrategy = undefined,
    E = never,
    R = never,
  >(
    polymorphicPort: PolymorphicEffect<EffectfulMIDIPort<TType>, E, R>,
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): StateChangesStream<TOnNullStrategy, TType, E, R>
}

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface MakeStateChangesStreamPortLast<
  THighLevelTypeRestriction extends MIDIPortType = MIDIPortType,
> {
  /**
   * @param options Passing a boolean is equivalent to setting `options.capture`
   * property
   */
  <const TOnNullStrategy extends OnNullStrategy = undefined>(
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): {
    /**
     *
     *
     */
    <TType extends THighLevelTypeRestriction, E = never, R = never>(
      polymorphicPort: PolymorphicEffect<EffectfulMIDIPort<TType>, E, R>,
    ): StateChangesStream<TOnNullStrategy, TType, E, R>
  }
}

export type MIDIPortMutableProperty = 'state' | 'connection'
