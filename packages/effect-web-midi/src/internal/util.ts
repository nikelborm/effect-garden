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
export type MIDIPortId = string & Brand.Brand<'MIDIPortId'>

export const MIDIPortId = Brand.nominal<MIDIPortId>()

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

export const polymorphicCheckInDual =
  (is: (arg: unknown) => boolean) => (arg: IArguments) =>
    Effect.isEffect(arg[0]) || is(arg[0])

export function fromPolymorphic<A, E = never, R = never>(
  polymorphicValue: PolymorphicEffect<A, E, R>,
  is: (arg: unknown) => arg is A,
) {
  const check = (value: A) =>
    is(value)
      ? Effect.succeed(value)
      : Effect.dieMessage('Assertion failed on polymorphic value')

  return Effect.isEffect(polymorphicValue)
    ? Effect.flatMap(polymorphicValue, check)
    : check(polymorphicValue)
}
