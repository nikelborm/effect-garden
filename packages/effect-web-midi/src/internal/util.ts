import * as Brand from 'effect/Brand'
import * as Effect from 'effect/Effect'
import * as Struct from 'effect/Struct'
import type {
  BadMidiMessageError,
  InvalidAccessError,
  InvalidStateError,
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

// TODO: call toJSON instead?
export const getStaticMIDIPortInfo = (port: MIDIPort) =>
  Struct.pick(port, ...midiPortStaticFields)

/**
 * Puts Self into success channel for easier chaining of operations on the same
 * entity
 */
export interface SentMessageEffectFrom<Self, E = never, R = never>
  extends Effect.Effect<
    Self,
    E | InvalidAccessError | InvalidStateError | BadMidiMessageError,
    R
  > {}

export type IsomorphicEffect<A, E, R> = A | Effect.Effect<A, E, R>

export const isomorphicCheckInDual =
  (is: (arg: unknown) => boolean) => (arg: IArguments) =>
    Effect.isEffect(arg[0]) || is(arg[0])

export function fromIsomorphic<A, E = never, R = never>(
  isomorphicValue: IsomorphicEffect<A, E, R>,
  is: (arg: unknown) => arg is A,
) {
  const check = (value: A) =>
    is(value)
      ? Effect.succeed(value)
      : Effect.dieMessage('Assertion failed on isomorphic value')

  return Effect.isEffect(isomorphicValue)
    ? Effect.flatMap(isomorphicValue, check)
    : check(isomorphicValue)
}
