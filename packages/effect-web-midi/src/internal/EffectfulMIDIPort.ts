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
 * Thin wrapper around {@linkcode MIDIPort} instance. Will be seen in all
 * external code.
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
  TPortType extends MIDIPortType = MIDIPortType,
> extends EffectfulMIDIPort<TPortType> {
  readonly _port: TPort
}

/**
 *
 *
 * @internal
 */
export const makeImpl = <
  TPort extends MIDIPort,
  TPortType extends MIDIPortType,
>(
  port: NoInfer<TPort>,
  type: TPortType,
  ClassToAssertInheritance: new (...args: unknown[]) => TPort,
): EffectfulMIDIPortImpl<TPort, TPortType> => {
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
export const assumeImpl = (port: EffectfulMIDIPort) =>
  port as EffectfulMIDIPortImpl

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
export const resolve = <
  TMIDIPortType extends MIDIPortType = MIDIPortType,
  E = never,
  R = never,
>(
  polymorphicPort: PolymorphicPort<E, R, TMIDIPortType>,
) =>
  fromPolymorphic(
    polymorphicPort,
    is as (port: unknown) => port is EffectfulMIDIPort<TMIDIPortType>,
  )

/**
 *
 *
 */
export type PolymorphicPort<
  E,
  R,
  TMIDIPortType extends MIDIPortType = MIDIPortType,
> = PolymorphicEffect<EffectfulMIDIPort<TMIDIPortType>, E, R>

/**
 *
 *
 * @internal
 */
export const isImplOfSpecificType =
  <const TPortType extends MIDIPortType, TPort extends MIDIPort>(
    type: TPortType,
    ClassToAssertInheritance: new (...args: unknown[]) => TPort,
  ) =>
  (port: unknown): port is EffectfulMIDIPortImpl<TPort, TPortType> => {
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
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface StateChangesStream<
  TOnNullStrategy extends OnNullStrategy,
  TPortType extends MIDIPortType,
  E = never,
  R = never,
> extends BuiltStream<
    'MIDIPortStateChange',
    EffectfulMIDIPort<TPortType>,
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
