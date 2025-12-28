import * as Brand from 'effect/Brand'
import * as EMIDIPort from './EMIDIPort.ts'
import * as StreamMaker from './StreamMaker.ts'
import * as Util from './util.ts'

// TODO: implement scoping of midi access that will clean up all message queues
// and streams, and remove listeners

// TODO: implement scope inheritance

/**
 * Thin wrapper around {@linkcode MIDIInput} instance. Will be seen in all
 * external code.
 */
export interface EMIDIInput extends EMIDIPort.EMIDIPort<'input'> {}

/**
 * Thin wrapper around {@linkcode MIDIInput} instance giving access to the
 * actual field storing it.
 * @internal
 */
interface EMIDIInputImpl extends EMIDIPort.EMIDIPortImpl<MIDIInput, 'input'> {}

/**
 * Validates the raw MIDI input port, and puts it into a field hidden from the
 * client's code
 *
 * @internal
 */
const makeImpl = (rawInput: MIDIInput): EMIDIInputImpl =>
  EMIDIPort.makeImpl(rawInput, 'input', globalThis.MIDIInput)

/**
 * Asserts an object to be valid EMIDIInput and casts it to internal
 * implementation type
 *
 * @internal
 */
const assertImpl = (input: unknown) => {
  if (!isImpl(input)) throw new Error('Failed to cast to EMIDIInputImpl')
  return input
}

/**
 * Asserts an object to be valid EMIDIInput
 */
export const assert: (input: unknown) => EMIDIInput = assertImpl

/**
 * @internal
 */
const assumeImpl = (input: EMIDIInput) => input as EMIDIInputImpl

/**
 *
 *
 * @internal
 */
export const make: (rawInput: MIDIInput) => EMIDIInput = makeImpl

/**
 *
 *
 * @internal
 */
const isImpl: (input: unknown) => input is EMIDIInputImpl =
  EMIDIPort.isImplOfSpecificType('input', globalThis.MIDIInput)

/**
 *
 *
 */
export const is: (input: unknown) => input is EMIDIInput = isImpl

/**
 * [MIDIMessageEvent MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIMessageEvent)
 *
 * MIDI spec says that synthetically built `MIDIMessageEvent`s can have `data`
 * field equal to `null`, but when coming from the browser, they won't. The
 * default behavior is to defect on `null`.
 */
export const makeMessagesStreamByPort =
  StreamMaker.createStreamMakerFrom<MIDIInputEventMap>()(
    is,
    input => ({
      tag: 'MIDIMessage',
      eventListener: {
        target: assumeImpl(input)._port,
        type: 'midimessage',
      },
      spanAttributes: {
        spanTargetName: 'MIDI port',
        port: Util.getStaticMIDIPortInfo(input),
      },
      nullableFieldName: 'data',
    }),
    midiMessage => ({ midiMessage }),
  )

/**
 *
 *
 */
export type PolymorphicInput<E, R> = EMIDIPort.PolymorphicPort<E, R, 'input'>

/**
 *
 *
 */
export type PolymorphicInputClean = EMIDIPort.PolymorphicPortClean<'input'>

export type Id = EMIDIPort.Id<'input'>
export const Id = Brand.nominal<Id>()
