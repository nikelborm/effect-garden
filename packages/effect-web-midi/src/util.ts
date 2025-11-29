import * as Brand from 'effect/Brand'
import type * as Effect from 'effect/Effect'
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

const midiPortStaticFields = [
  'id',
  'name',
  'manufacturer',
  'version',
  'type',
] as const

export type MIDIPortStaticFields = (typeof midiPortStaticFields)[number]

export const getStaticMIDIPortInfo = (port: MIDIPort) =>
  Struct.pick(port, ...midiPortStaticFields)

/**
 * Returns self for easier chaining of operations on the same entity
 */
export interface SentMessageEffectFrom<Self, E = never, R = never>
  extends Effect.Effect<
    Self,
    E | InvalidAccessError | InvalidStateError | BadMidiMessageError,
    R
  > {}
