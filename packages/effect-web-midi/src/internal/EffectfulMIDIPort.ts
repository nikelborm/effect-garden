/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */
import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Hash from 'effect/Hash'
import * as Inspectable from 'effect/Inspectable'
import * as Pipeable from 'effect/Pipeable'
import {
  type BuiltStream,
  createStreamMakerFrom,
  makeStreamFromWrapped,
  type OnNullStrategy,
  type StreamMakerOptions,
} from './createStreamMakerFrom.ts'
import { InvalidAccessError, remapErrorByName } from './errors.ts'
import { getStaticMIDIPortInfo } from './util.ts'

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

  toJSON<Port extends MIDIPort, Type extends MIDIPortType>(
    this: EffectfulMIDIPortImpl<Port, Type>,
  ) {
    return {
      _id: 'EffectfulMIDIPort',
      id: this.id,
      name: this.name,
      manufacturer: this.manufacturer,
      version: this.version,
      type: this.type,
    }
  },

  [Inspectable.NodeInspectSymbol]<
    Port extends MIDIPort,
    Type extends MIDIPortType,
  >(this: EffectfulMIDIPortImpl<Port, Type>) {
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
} satisfies EffectfulMIDIPort<MIDIPortType>

export interface EffectfulMIDIPort<Type extends MIDIPortType>
  extends Equal.Equal,
    Pipeable.Pipeable,
    Inspectable.Inspectable,
    Pick<MIDIPort, 'version' | 'name' | 'id' | 'manufacturer'> {
  readonly [TypeId]: TypeId
  readonly _tag: 'EffectfulMIDIPort'
  readonly type: Type
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
 *
 *
 * @internal
 */
const asImpl = (port: EffectfulMIDIPort<MIDIPortType>) => {
  if (!isGeneralImpl(port))
    throw new Error('Failed to cast to EffectfulMIDIPort<MIDIPortType>')
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
  port._port !== null &&
  port._port instanceof MIDIPort

/**
 *
 *
 */
export const is: (port: unknown) => port is EffectfulMIDIPort<MIDIPortType> =
  isGeneralImpl

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
export const openConnectionFromWrapped = <TType extends MIDIPortType, E, R>(
  wrappedPort: Effect.Effect<EffectfulMIDIPort<TType>, E, R>,
) => Effect.flatMap(wrappedPort, openConnection)

/**
 * @returns An effect with the same port for easier chaining of operations
 */
export const closeConnection = callMIDIPortMethod('close', err => {
  throw err
})

/**
 * @returns An effect with the same port for easier chaining of operations
 */
export const closeConnectionFromWrapped = <TType extends MIDIPortType, E, R>(
  wrappedPort: Effect.Effect<EffectfulMIDIPort<TType>, E, R>,
) => Effect.flatMap(wrappedPort, closeConnection)

/**
 * [MIDIConnectionEvent MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
const _makeStateChangesStream = createStreamMakerFrom<MIDIPortEventMap>()(
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
)

/**
 *
 *
 */
export const makeStateChangesStream =
  _makeStateChangesStream as DualStateChangesStreamMaker

/**
 *
 *
 */
export const makeStateChangesStreamFromWrapped = makeStreamFromWrapped(
  _makeStateChangesStream,
) as DualStateChangesStreamMakerFromWrapped

/**
 * @returns A state of connection between the OS and the device. It's
 * unconventional to return mutable references in Effect. It's taken from the
 * {@linkcode MIDIPort.state|state} read-only property of the
 * {@linkcode MIDIPort} interface ([MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/state)).
 */
const getDeviceStateUnconventional = (port: EffectfulMIDIPort<MIDIPortType>) =>
  asImpl(port)._port.state

/**
 * @returns A state of connection between the OS and the device. Because it can
 * change over time, it's wrapped in effect. It's taken from the
 * {@linkcode MIDIPort.state|state} read-only property of the
 * {@linkcode MIDIPort} interface ([MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/state)).
 */
export const getDeviceState = (port: EffectfulMIDIPort<MIDIPortType>) =>
  Effect.sync(() => getDeviceStateUnconventional(port))

/**
 *
 *
 */
export const getDeviceStateFromWrapped = <E, R>(
  wrappedPort: Effect.Effect<EffectfulMIDIPort<MIDIPortType>, E, R>,
) => Effect.map(wrappedPort, getDeviceStateUnconventional)

/**
 *
 *
 */
const getConnectionStateUnconventional = (
  port: EffectfulMIDIPort<MIDIPortType>,
) => asImpl(port)._port.connection

/**
 * Because connection state can change over time, it's effectful. It's taken
 * from the **`connection`** read-only property of the `MIDIPort` interface
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/connection)
 */
export const getConnectionState = (port: EffectfulMIDIPort<MIDIPortType>) =>
  Effect.sync(() => getConnectionStateUnconventional(port))

/**
 *
 *
 */
export const getConnectionStateFromWrapped = <E, R>(
  wrappedPort: Effect.Effect<EffectfulMIDIPort<MIDIPortType>, E, R>,
) => Effect.map(wrappedPort, getConnectionStateUnconventional)

export interface StateChangeStream<
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
    ): StateChangeStream<TOnNullStrategy, TType>
  }

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
  ): StateChangeStream<TOnNullStrategy, TType>
}

export interface DualStateChangesStreamMakerFromWrapped<
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
    <TType extends THighLevelTypeRestriction, E, R>(
      wrappedPort: Effect.Effect<EffectfulMIDIPort<TType>, E, R>,
    ): StateChangeStream<TOnNullStrategy, TType, E, R>
  }

  /**
   * @param options Passing a boolean is equivalent to setting `options.capture`
   * property
   */
  <
    TType extends THighLevelTypeRestriction,
    E,
    R,
    const TOnNullStrategy extends OnNullStrategy = undefined,
  >(
    wrappedPort: Effect.Effect<EffectfulMIDIPort<TType>, E, R>,
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): StateChangeStream<TOnNullStrategy, TType, E, R>
}
