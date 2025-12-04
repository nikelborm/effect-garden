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
import { InvalidAccessError, remapErrorByName } from './errors.ts'
import {
  fromIsomorphic,
  getStaticMIDIPortInfo,
  type IsomorphicEffect,
  isomorphicCheckInDual,
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
    return asImpl(this)._port.id
  },
  get name() {
    return asImpl(this)._port.name
  },
  get manufacturer() {
    return asImpl(this)._port.manufacturer
  },
  get version() {
    return asImpl(this)._port.version
  },
  get type() {
    return asImpl(this)._port.type
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
    Pick<MIDIPort, 'version' | 'name' | 'id' | 'manufacturer'> {
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
  Port extends MIDIPort = MIDIPort,
  Type extends MIDIPortType = MIDIPortType,
> extends EffectfulMIDIPort<Type> {
  readonly _port: Port
}

/**
 *
 *
 * @internal
 */
export const makeImpl = <Port extends MIDIPort, Type extends MIDIPortType>(
  port: NoInfer<Port>,
  type: Type,
  ClassToAssertInheritance: new (...args: unknown[]) => Port,
): EffectfulMIDIPortImpl<Port, Type> => {
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
const asImpl = (port: EffectfulMIDIPort) => {
  if (!isGeneralImpl(port))
    throw new Error('Failed to cast to EffectfulMIDIPort')
  return port
}

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
  <const Type extends MIDIPortType, Port extends MIDIPort>(
    type: Type,
    ClassToAssertInheritance: new (...args: unknown[]) => Port,
  ) =>
  (port: unknown): port is EffectfulMIDIPortImpl<Port, Type> =>
    isGeneralImpl(port) &&
    port.type === type &&
    port._port instanceof ClassToAssertInheritance

/**
 *
 *
 */
export const is: (port: unknown) => port is EffectfulMIDIPort = isGeneralImpl

// TODO: maybe open issue in upstream spec about why they are sync, while other are async
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
  >(isomorphicPort: IsomorphicEffect<EffectfulMIDIPort<TType>, E, R>) {
    const port = yield* fromIsomorphic(isomorphicPort, is)

    yield* Effect.annotateCurrentSpan({
      method,
      port: getStaticMIDIPortInfo(asImpl(port)._port),
    })

    yield* Effect.tryPromise({
      try: () => asImpl(port)._port[method](),
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
    { InvalidAccessError },
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
export const acquireReleaseConnection = <TType extends MIDIPortType>(
  port: EffectfulMIDIPort<TType>,
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
    eventListener: { target: asImpl(port)._port, type: 'statechange' },
    spanAttributes: {
      spanTargetName: 'MIDI port',
      port: getStaticMIDIPortInfo(asImpl(port)._port),
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
) as DualStateChangesStreamMaker

// const asd = makeStateChangesStream({} as any, {})
// asd

const getValueInRawPortFieldUnsafe =
  <const TPortMutableProperty extends 'state' | 'connection'>(
    property: TPortMutableProperty,
  ) =>
  (port: EffectfulMIDIPort) =>
    asImpl(port)._port[property]

const getMutableProperty =
  <const TPortMutableProperty extends 'state' | 'connection'>(
    property: TPortMutableProperty,
  ) =>
  <E = never, R = never>(port: IsomorphicEffect<EffectfulMIDIPort, E, R>) =>
    Effect.isEffect(port)
      ? Effect.map(port, getValueInRawPortFieldUnsafe(property))
      : Effect.sync(() => getValueInRawPortFieldUnsafe(property)(port))

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
  const TMIDIPortProperty extends 'state' | 'connection',
  TMIDIPortTypeHighLevelRestriction extends MIDIPortType,
>(
  property: TMIDIPortProperty,
  is: (
    port: unknown,
  ) => port is EffectfulMIDIPort<TMIDIPortTypeHighLevelRestriction>,
) =>
  dual<
    MatchPortLast<TMIDIPortTypeHighLevelRestriction, TMIDIPortProperty>,
    MatchPortFirst<TMIDIPortTypeHighLevelRestriction, TMIDIPortProperty>
  >(
    isomorphicCheckInDual(is),
    Effect.fn('matchMutableMIDIPortProperty')(
      function* (isomorphicPort, config) {
        const port = yield* fromIsomorphic(isomorphicPort, is)

        const state = getValueInRawPortFieldUnsafe(property)(port)

        for (const [stateCase, stateCallback] of Record.toEntries(config))
          if (state === stateCase)
            return (stateCallback as PortStateHandler)(port)

        throw new Error(
          `AssertionFailed: Missing handler for "${state}" state inside "${property}" property`,
        )
      },
    ),
  )

// biome-ignore lint/suspicious/noExplicitAny: <There's no better way to type>
export type PortStateHandler = (port: EffectfulMIDIPort) => any
export type MatcherConfigPlain = Record<string, PortStateHandler>

export interface MatchResult<ActualConf extends MatcherConfigPlain, E, R>
  extends Effect.Effect<ReturnType<ActualConf[keyof ActualConf]>, E, R> {}

export interface MatchPortFirst<
  TMIDIPortTypeHighLevelRestriction extends MIDIPortType,
  TMIDIPortProperty extends 'state' | 'connection',
> {
  /**
   * Description placeholder
   *
   * @param port
   * @param config
   * @returns
   */
  <
    ActualConf extends GoodConfig<
      TMIDIPortProperty,
      TMIDIPortTypeHighLevelRestriction,
      ActualConf
    >,
    TMIDIPortType extends TMIDIPortTypeHighLevelRestriction,
    E = never,
    R = never,
  >(
    port: IsomorphicEffect<EffectfulMIDIPort<TMIDIPortType>, E, R>,
    config: ActualConf,
  ): MatchResult<ActualConf, E, R>
}

export interface MatchPortLast<
  TMIDIPortTypeHighLevelRestriction extends MIDIPortType,
  TMIDIPortProperty extends 'state' | 'connection',
> {
  /**
   * Description placeholder
   *
   * @param config
   * @returns
   */
  <
    ActualConf extends GoodConfig<
      TMIDIPortProperty,
      TMIDIPortTypeHighLevelRestriction,
      ActualConf
    >,
  >(
    config: ActualConf,
  ): {
    /**
     * Description placeholder
     *
     * @param port
     * @returns
     */
    <
      TMIDIPortType extends TMIDIPortTypeHighLevelRestriction,
      E = never,
      R = never,
    >(
      port: IsomorphicEffect<EffectfulMIDIPort<TMIDIPortType>, E, R>,
    ): MatchResult<ActualConf, E, R>
  }
}

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

export type GoodConfig<
  TMIDIPortProperty extends 'state' | 'connection',
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
  TE = never,
  TR = never,
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
    TE,
    TR
  > {}

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface DualStateChangesStreamMaker<
  THighLevelTypeRestriction extends MIDIPortType = MIDIPortType,
> extends StateChangesStreamMakerPortFirst<THighLevelTypeRestriction>,
    StateChangesStreamMakerPortLast<THighLevelTypeRestriction> {}

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface StateChangesStreamMakerPortFirst<
  THighLevelTypeRestriction extends MIDIPortType = MIDIPortType,
> {
  /**
   * @param options Passing a boolean is equivalent to setting `options.capture`
   * property
   */
  <
    TType extends THighLevelTypeRestriction,
    const TOnNullStrategy extends OnNullStrategy = undefined,
    TE = never,
    TR = never,
  >(
    isomorphicPort: IsomorphicEffect<EffectfulMIDIPort<TType>, TE, TR>,
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): StateChangesStream<TOnNullStrategy, TType, TE, TR>
}

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface StateChangesStreamMakerPortLast<
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
    <TType extends THighLevelTypeRestriction, TE = never, TR = never>(
      isomorphicPort: IsomorphicEffect<EffectfulMIDIPort<TType>, TE, TR>,
    ): StateChangesStream<TOnNullStrategy, TType, TE, TR>
  }
}
