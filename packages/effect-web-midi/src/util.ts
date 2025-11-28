import * as Brand from 'effect/Brand'
import * as Struct from 'effect/Struct'

// Built with the help of spec from here
// ! https://www.w3.org/TR/webmidi/

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
 * A type that represents a deeply readonly object. This is similar to
 * TypeScript's `Readonly` type, but it recursively applies the `readonly`
 * modifier to all properties of an object and all elements of arrays.
 */
export type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends object
    ? {
        readonly [K in keyof T]: DeepReadonly<T[K]>
      }
    : T
