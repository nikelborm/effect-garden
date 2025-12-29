/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Brand from 'effect/Brand'
import * as Equal from 'effect/Equal'
import * as Hash from 'effect/Hash'
import * as Inspectable from 'effect/Inspectable'
import * as Pipeable from 'effect/Pipeable'
import type * as Util from './Util.ts'

/**
 * Unique symbol used for distinguishing {@linkcode EMIDIPort} instances
 * from other objects at both runtime and type-level
 * @internal
 */
const TypeId: unique symbol = Symbol.for('effect-web-midi/EMIDIPort')

/**
 * Unique symbol used for distinguishing {@linkcode EMIDIPort} instances
 * from other objects at both runtime and type-level
 */
export type TypeId = typeof TypeId

/**
 * Prototype of all {@linkcode EMIDIPort} instances
 * @internal
 */
const CommonProto = {
  _tag: 'EMIDIPort' as const,

  [TypeId]: TypeId,

  [Hash.symbol](this: EMIDIPortImpl) {
    return Hash.string(this.id)
  },

  [Equal.symbol](this: EMIDIPortImpl, that: Equal.Equal) {
    return 'id' in that && this.id === that.id
  },

  pipe() {
    // biome-ignore lint/complexity/noArguments: Effect's tradition
    return Pipeable.pipeArguments(this, arguments)
  },

  toString(this: EMIDIPortImpl) {
    return Inspectable.format(this.toJSON())
  },

  toJSON(this: EMIDIPortImpl) {
    return {
      _id: 'EMIDIPort',
      id: this.id,
      name: this.name,
      manufacturer: this.manufacturer,
      version: this.version,
      type: this.type,
    }
  },

  [Inspectable.NodeInspectSymbol](this: EMIDIPortImpl) {
    return this.toJSON()
  },

  get id() {
    return BothId(assumeImpl(this)._port.id)
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
} satisfies EMIDIPort

/**
 * Thin wrapper around {@linkcode MIDIPort} instance. Will be seen in all
 * external code.
 */
export interface EMIDIPort<TMIDIPortType extends MIDIPortType = MIDIPortType>
  extends Equal.Equal,
    Pipeable.Pipeable,
    Inspectable.Inspectable,
    Pick<MIDIPort, 'version' | 'name' | 'manufacturer'> {
  /**
   * The **`id`** read-only property of the MIDIPort interface returns the unique ID of the port.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/id)
   */
  readonly id: Id<TMIDIPortType>
  readonly [TypeId]: TypeId
  readonly _tag: 'EMIDIPort'
  readonly type: TMIDIPortType
}

/**
 * Thin wrapper around {@linkcode MIDIPort} instance giving access to the
 * actual field storing it.
 * @internal
 */
export interface EMIDIPortImpl<
  TPort extends MIDIPort = MIDIPort,
  TPortType extends MIDIPortType = MIDIPortType,
> extends EMIDIPort<TPortType> {
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
): EMIDIPortImpl<TPort, TPortType> => {
  if (port.type !== type || !(port instanceof ClassToAssertInheritance))
    throw new Error(`EMIDIPort constructor accepts only ${type} ports`)

  const instance = Object.create(CommonProto)
  instance._port = port
  return instance
}

/**
 * Asserts an object to be valid EMIDIPort and casts it to internal
 * implementation type
 *
 * @internal
 */
const assertImpl = (port: unknown) => {
  if (!isGeneralImpl(port)) throw new Error('Failed to cast to EMIDIPort')
  return port
}

/**
 * Asserts an object to be valid EMIDIPort
 */
export const assert: (port: unknown) => EMIDIPort = assertImpl

/**
 * @internal
 */
export const assumeImpl = (port: EMIDIPort) => port as EMIDIPortImpl

/**
 *
 *
 * @internal
 */
const isGeneralImpl = (port: unknown): port is EMIDIPortImpl =>
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
 */
export type PolymorphicPort<
  E,
  R,
  TMIDIPortType extends MIDIPortType = MIDIPortType,
> = Util.PolymorphicEffect<EMIDIPort<TMIDIPortType>, E, R>

/**
 *
 *
 */
export type PolymorphicPortClean<
  TMIDIPortType extends MIDIPortType = MIDIPortType,
> = PolymorphicPort<never, never, TMIDIPortType>

export type ExtractTypeFromPort<TPort extends EMIDIPort> =
  TPort extends EMIDIPort<infer TPortType> ? TPortType : never

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
  (port: unknown): port is EMIDIPortImpl<TPort, TPortType> => {
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
export const is: (port: unknown) => port is EMIDIPort = isGeneralImpl

/**
 * Unique identifier of the MIDI port.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/id)
 */
export type Id<TPortType extends MIDIPortType> =
  // for distribution
  TPortType extends MIDIPortType
    ? string & Brand.Brand<'MIDIPortId'> & Brand.Brand<TPortType>
    : never

export type BothId = Id<MIDIPortType>
export const BothId = Brand.nominal<BothId>()
