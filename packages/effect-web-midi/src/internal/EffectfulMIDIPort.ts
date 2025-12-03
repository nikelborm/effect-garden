/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */
import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import { flow } from 'effect/Function'
import * as Hash from 'effect/Hash'
import * as Inspectable from 'effect/Inspectable'
import * as Match from 'effect/Match'
import * as Pipeable from 'effect/Pipeable'
import * as Record from 'effect/Record'
import type * as Types from 'effect/Types'
import {
  type BuiltStream,
  createStreamMakerFrom,
  type OnNullStrategy,
  type StreamMakerOptions,
} from './createStreamMakerFrom.ts'
import { InvalidAccessError, remapErrorByName } from './errors.ts'
import { getStaticMIDIPortInfo } from './util.ts'

// TODO: device and connection state Match-ers

/**
 * @internal
 */
const TypeId: unique symbol = Symbol.for(
  '@nikelborm/effect-web-midi/EffectfulMIDIPort',
)

/**
 * Unique symbol used for distinguishing EffectfulMIDIPort instances from other
 * objects at both runtime and type-level
 */
export type TypeId = typeof TypeId

/**
 * Prototype of all EffectfulMIDIPort instances
 *
 * @internal
 */
export const CommonProto = {
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
 *
 *
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
const callMIDIPortMethod =
  <TError = never>(
    method: 'close' | 'open',
    mapError: (err: unknown) => TError,
  ) =>
  <TType extends MIDIPortType>(
    port: EffectfulMIDIPort<TType>,
  ): Effect.Effect<EffectfulMIDIPort<TType>, TError> =>
    Effect.tryPromise({
      try: () => asImpl(port)._port[method](),
      catch: mapError,
    }).pipe(
      Effect.as(port),
      Effect.withSpan(`MIDI port method call`, {
        attributes: {
          method,
          port: getStaticMIDIPortInfo(asImpl(port)._port),
        },
      }),
    )

/**
 * @returns An effect with the same port for easier chaining of operations
 */
export const acquireReleaseConnection = <TType extends MIDIPortType>(
  port: EffectfulMIDIPort<TType>,
) => Effect.acquireRelease(openConnection(port), closeConnection)

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
 * [MIDIConnectionEvent MDN
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

const getMutableProperty =
  <const T extends 'state' | 'connection'>(property: T) =>
  <E = never, R = never>(
    port: EffectfulMIDIPort | Effect.Effect<EffectfulMIDIPort, E, R>,
  ): Effect.Effect<MIDIPort[T], E, R> => {
    const get = (port: EffectfulMIDIPort) => asImpl(port)._port[property]

    if (Effect.isEffect(port)) return Effect.map(port, get)
    return Effect.sync(() => get(port))
  }

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

// TODO: dual
/**
 * @internal
 */
export const matchMutableMIDIPortProperty =
  <const TMIDIPortProperty extends 'state' | 'connection'>(
    property: TMIDIPortProperty,
  ) =>
  <TMIDIPortTypeHighLevelRestriction extends MIDIPortType>() =>
  <
    Config extends MatchMutablePropertyConfig<
      TMIDIPortProperty,
      GoodConfig<TMIDIPortProperty, TMIDIPortTypeHighLevelRestriction>,
      Config
    >,
  >(
    config: Config,
  ) =>
  <
    TMIDIPortType extends TMIDIPortTypeHighLevelRestriction,
    E = never,
    R = never,
  >(
    port:
      | EffectfulMIDIPort<TMIDIPortType>
      | Effect.Effect<EffectfulMIDIPort<TMIDIPortType>, E, R>,
  ): Effect.Effect<ReturnType<Config[keyof Config]>, E, R> =>
    Effect.map(
      getMutableProperty(property)(port),
      Match.exhaustive(
        Record.reduce(
          config,
          Match.type<MIDIPort[TMIDIPortProperty]>() as any,
          (matcher, stateCallback: Function, stateCase) =>
            Match.when(stateCase, () => stateCallback(port))(matcher),
        ),
      ) as any,
    )

/**
 *
 */
export const matchConnectionState = matchMutableMIDIPortProperty('connection')()

/**
 *
 */
export const matchDeviceState = matchMutableMIDIPortProperty('state')()

export type GoodConfig<
  TMIDIPortProperty extends 'state' | 'connection',
  TMIDIPortType extends MIDIPortType = MIDIPortType,
> = {
  readonly [StateCase in MIDIPort[TMIDIPortProperty]]: (
    port: EffectfulMIDIPort<TMIDIPortType>,
  ) => any
}

export type MatchMutablePropertyConfig<
  TMIDIPortProperty extends 'state' | 'connection',
  // needed so that we can pass interface name which will hold JSDoc
  // documentation attached. otherwise TS will erase this info at any moment
  WellDocumentedConfig extends GoodConfig<TMIDIPortProperty>,
  ConfigItself,
> = Types.Equals<keyof WellDocumentedConfig, keyof ConfigItself> extends true
  ? WellDocumentedConfig
  : GoodConfig<TMIDIPortProperty> & {
      readonly [RedundantValueCaseHandling in Exclude<
        keyof ConfigItself,
        MIDIPort[TMIDIPortProperty]
      >]: never
    }

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

export interface DualStateChangesStreamMaker<
  THighLevelTypeRestriction extends MIDIPortType = MIDIPortType,
> extends StateChangesStreamMakerPortFirst<THighLevelTypeRestriction>,
    StateChangesStreamMakerPortLast<THighLevelTypeRestriction> {}

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
  >(
    port: EffectfulMIDIPort<TType>,
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): StateChangesStream<TOnNullStrategy, TType>
}

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
    <TType extends THighLevelTypeRestriction>(
      port: EffectfulMIDIPort<TType>,
    ): StateChangesStream<TOnNullStrategy, TType>
  }
}
