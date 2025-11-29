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
 * Unique symbol used for distinguishing EffectfulMIDIPort instances from other
 * objects at both runtime and type-level
 */
export const TypeId: unique symbol = Symbol.for(
  '@nikelborm/effect-web-midi/EffectfulMIDIPort',
)

/**
 * Unique symbol used for distinguishing EffectfulMIDIPort instances from other
 * objects at both runtime and type-level
 */
export type TypeId = typeof TypeId

/**
 * Prototype of all EffectfulMIDIPort instances
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
    return (this as EffectfulMIDIPortImpl)._port.id
  },
  get name() {
    return (this as EffectfulMIDIPortImpl)._port.name
  },
  get manufacturer() {
    return (this as EffectfulMIDIPortImpl)._port.manufacturer
  },
  get version() {
    return (this as EffectfulMIDIPortImpl)._port.version
  },
  get type() {
    return (this as EffectfulMIDIPortImpl)._port.type
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

/** @internal */
export interface EffectfulMIDIPortImpl<
  Port extends MIDIPort = MIDIPort,
  Type extends MIDIPortType = MIDIPortType,
> extends EffectfulMIDIPort<Type> {
  readonly _port: Port
}

/** @internal */
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

/** @internal */
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

export const is: (port: unknown) => port is EffectfulMIDIPort<MIDIPortType> =
  isGeneralImpl

/** @internal */
export const isImplOfSpecificType =
  <const Type extends MIDIPortType, Port extends MIDIPort>(
    type: Type,
    ClassToAssertInheritance: new (...args: unknown[]) => Port,
  ) =>
  (port: unknown): port is EffectfulMIDIPortImpl<Port, Type> =>
    isGeneralImpl(port) &&
    port.type === type &&
    port._port instanceof ClassToAssertInheritance

export const isOfSpecificType: <const Type extends MIDIPortType>(
  type: Type,
  ClassToAssertInheritance: new (...args: unknown[]) => MIDIPort,
) => (port: unknown) => port is EffectfulMIDIPort<Type> = isImplOfSpecificType

/** @internal */
const asImpl = (port: EffectfulMIDIPort<MIDIPortType>) => {
  if (!isGeneralImpl(port))
    throw new Error('Failed to cast to EffectfulMIDIPort<MIDIPortType>')
  return port
}

// TODO: maybe open issue in upstream spec about why they are sync, while other are async
/** @internal */
const callMIDIPortMethod =
  <TError = never>(
    method: 'close' | 'open',
    mapError: (err: unknown) => TError,
  ) =>
  <TType extends MIDIPortType>(
    self: EffectfulMIDIPort<TType>,
  ): Effect.Effect<EffectfulMIDIPort<TType>, TError> =>
    Effect.tryPromise({
      try: () => asImpl(self)._port[method](),
      catch: mapError,
    }).pipe(
      Effect.as(self),
      Effect.withSpan(`MIDI port method call`, {
        attributes: {
          method,
          // call toJSON instead?
          port: getStaticMIDIPortInfo(asImpl(self)._port),
        },
      }),
    )

// TODO: documentation
export const acquireReleaseConnection = <TType extends MIDIPortType>(
  self: EffectfulMIDIPort<TType>,
) => Effect.acquireRelease(openConnection(self), closeConnection)

// TODO: documentation
export const openConnection = callMIDIPortMethod(
  'open',
  remapErrorByName(
    { InvalidAccessError },
    'MIDI port open error handling absurd',
  ),
)

// TODO: documentation
export const openConnectionFromWrapped = <TType extends MIDIPortType, E, R>(
  self: Effect.Effect<EffectfulMIDIPort<TType>, E, R>,
) => Effect.flatMap(self, openConnection)

// TODO: documentation
export const closeConnection = callMIDIPortMethod('close', err => {
  throw err
})

// TODO: documentation
export const closeConnectionFromWrapped = <TType extends MIDIPortType, E, R>(
  self: Effect.Effect<EffectfulMIDIPort<TType>, E, R>,
) => Effect.flatMap(self, closeConnection)

/**
 * [MIDIConnectionEvent MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
// TODO: documentation
export const makeStateChangesStream = createStreamMakerFrom<MIDIPortEventMap>()(
  is,
  self => ({
    tag: 'MIDIPortStateChange',
    eventListener: { target: asImpl(self)._port, type: 'statechange' },
    spanAttributes: {
      spanTargetName: 'MIDI port',
      port: getStaticMIDIPortInfo(asImpl(self)._port),
    },
    nullableFieldName: 'port',
  }),
  rawPort => ({
    newState: rawPort
      ? ({ ofDevice: rawPort.state, ofConnection: rawPort.connection } as const)
      : null,
  }),
) as DualStateChangesStreamMaker

// TODO: documentation
export const makeStateChangesStreamFromWrapped = makeStreamFromWrapped(
  makeStateChangesStream,
) as unknown as DualStateChangesStreamMakerFromWrapped

// TODO: documentation
export const getDeviceStateUnsafe = (self: EffectfulMIDIPort<MIDIPortType>) =>
  (self as EffectfulMIDIPortImpl)._port.state

/**
 * Because device state can change over time, it's effectful.
 * The **`state`** read-only property of the MIDIPort interface returns the
 * state of the port.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/state)
 */
export const getDeviceState = (self: EffectfulMIDIPort<MIDIPortType>) =>
  Effect.sync(() => getDeviceStateUnsafe(self))

// TODO: documentation
export const getDeviceStateFromWrapped = <E, R>(
  self: Effect.Effect<EffectfulMIDIPort<MIDIPortType>, E, R>,
) => Effect.map(self, getDeviceStateUnsafe)

// TODO: documentation
export const getConnectionStateUnsafe = (
  self: EffectfulMIDIPort<MIDIPortType>,
) => (self as EffectfulMIDIPortImpl)._port.connection

/**
 * Because connection state can change over time, it's effectful.
 *
 * The **`connection`** read-only property of the MIDIPort interface returns
 * the connection state of the port.
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/connection)
 */
export const getConnectionState = (self: EffectfulMIDIPort<MIDIPortType>) =>
  Effect.sync(() => getConnectionStateUnsafe(self))

// TODO: documentation
export const getConnectionStateFromWrapped = <E, R>(
  self: Effect.Effect<EffectfulMIDIPort<MIDIPortType>, E, R>,
) => Effect.map(self, getConnectionStateUnsafe)

export interface StateChangeStream<
  TOnNullStrategy extends OnNullStrategy,
  TType extends MIDIPortType,
  TE = never,
  TR = never,
> extends BuiltStream<
    'MIDIPortStateChange',
    EffectfulMIDIPort<TType>,
    {
      newState: {
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
  <const TOnNullStrategy extends OnNullStrategy = undefined>(
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): <TType extends THighLevelTypeRestriction>(
    self: EffectfulMIDIPort<TType>,
  ) => StateChangeStream<TOnNullStrategy, TType>
  <
    TType extends THighLevelTypeRestriction,
    const TOnNullStrategy extends OnNullStrategy = undefined,
  >(
    self: EffectfulMIDIPort<TType>,
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): StateChangeStream<TOnNullStrategy, TType>
}

export interface DualStateChangesStreamMakerFromWrapped<
  THighLevelTypeRestriction extends MIDIPortType = MIDIPortType,
> {
  <const TOnNullStrategy extends OnNullStrategy = undefined>(
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): <TType extends THighLevelTypeRestriction, E, R>(
    self: Effect.Effect<EffectfulMIDIPort<TType>, E, R>,
  ) => StateChangeStream<TOnNullStrategy, TType, E, R>
  <
    TType extends THighLevelTypeRestriction,
    E,
    R,
    const TOnNullStrategy extends OnNullStrategy = undefined,
  >(
    self: Effect.Effect<EffectfulMIDIPort<TType>, E, R>,
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): StateChangeStream<TOnNullStrategy, TType, E, R>
}
