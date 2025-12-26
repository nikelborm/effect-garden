import * as Brand from 'effect/Brand'
import * as Effect from 'effect/Effect'
import * as Struct from 'effect/Struct'
import type {
  CantSendSysexMessagesError,
  DisconnectedPortError,
  MalformedMidiMessageError,
} from './errors.ts'

/**
 * Unique identifier of the MIDI port.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MIDIPort/id)
 */
export type MIDIPortId<TPortType extends MIDIPortType> =
  // for distribution
  TPortType extends MIDIPortType
    ? string & Brand.Brand<'MIDIPortId'> & Brand.Brand<TPortType>
    : never

export type MIDIBothPortId = MIDIPortId<MIDIPortType>
export const MIDIBothPortId = Brand.nominal<MIDIBothPortId>()

export type MIDIOutputPortId = MIDIPortId<'output'>
export const MIDIOutputPortId = Brand.nominal<MIDIOutputPortId>()

export type MIDIInputPortId = MIDIPortId<'input'>
export const MIDIInputPortId = Brand.nominal<MIDIInputPortId>()

export const midiPortStaticFields = [
  'id',
  'name',
  'manufacturer',
  'version',
  'type',
] as const

export type MIDIPortStaticFields = (typeof midiPortStaticFields)[number]

export const getStaticMIDIPortInfo = (
  port: Pick<MIDIPort, MIDIPortStaticFields>,
) => Struct.pick(port, ...midiPortStaticFields)

/**
 * Puts Self into success channel for easier chaining of operations on the same
 * entity
 */
export interface SentMessageEffectFrom<Self, E = never, R = never>
  extends Effect.Effect<
    Self,
    | E
    | CantSendSysexMessagesError
    | MalformedMidiMessageError
    | DisconnectedPortError,
    R
  > {}

export type PolymorphicEffect<A, E, R> = A | Effect.Effect<A, E, R>

export type FallbackOnUnknownOrAny<TCandidate, Fallback> =
  unknown extends TCandidate
    ? TCandidate extends unknown
      ? Fallback
      : TCandidate
    : TCandidate

export const polymorphicCheckInDual =
  (is: (arg: unknown) => boolean) => (arg: IArguments) =>
    Effect.isEffect(arg[0]) || is(arg[0])

export function fromPolymorphic<A, E = never, R = never>(
  polymorphicValue: PolymorphicEffect<A, E, R>,
  is: (arg: unknown) => arg is NoInfer<A>,
) {
  const check = (value: A) =>
    is(value)
      ? Effect.succeed(value)
      : Effect.dieMessage('Assertion failed on polymorphic value')

  return Effect.isEffect(polymorphicValue)
    ? Effect.flatMap(polymorphicValue, check)
    : check(polymorphicValue)
}

/**
 * @internal
 */
const isEqual =
  <TWideValue extends string, TPropertyName extends string>() =>
  <const TExpectedValue extends TWideValue>(expected: TExpectedValue) =>
  <E, R>(self: Effect.Effect<TWideValue, E, R>) =>
    Effect.map(
      self,
      current =>
        (current === expected) as IsEqualFlag<TPropertyName, TExpectedValue>,
    )

export type IsEqualFlag<
  TPropertyName extends string,
  TExpectedValue extends string,
> = boolean &
  Brand.Brand<TPropertyName> &
  Brand.Brand<`expectedValue: ${TExpectedValue}`>

export const isCertainDeviceState = isEqual<
  MIDIPortDeviceState,
  'isCertainDeviceState'
>()

export const isCertainConnectionState = isEqual<
  MIDIPortConnectionState,
  'isCertainConnectionState'
>()

export const isDeviceConnected = isCertainDeviceState('connected')
export const isDeviceDisconnected = isCertainDeviceState('disconnected')

export const isConnectionOpen = isCertainConnectionState('open')
export const isConnectionPending = isCertainConnectionState('pending')
export const isConnectionClosed = isCertainConnectionState('closed')
