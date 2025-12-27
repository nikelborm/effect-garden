import * as Create from './createStreamMakerFrom.ts'
import * as EMIDIPort from './EMIDIPort.ts'
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
const assertImpl = (inputPort: unknown) => {
  if (!isImpl(inputPort)) throw new Error('Failed to cast to EMIDIInputImpl')
  return inputPort
}

/**
 * Asserts an object to be valid EMIDIInput
 */
export const assert: (inputPort: unknown) => EMIDIInput = assertImpl

/**
 * @internal
 */
const assumeImpl = (inputPort: EMIDIInput) => inputPort as EMIDIInputImpl

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
const isImpl: (inputPort: unknown) => inputPort is EMIDIInputImpl =
  EMIDIPort.isImplOfSpecificType('input', globalThis.MIDIInput)

/**
 *
 *
 */
export const is: (inputPort: unknown) => inputPort is EMIDIInput = isImpl

/**
 * [MIDIMessageEvent MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIMessageEvent)
 *
 * MIDI spec says that synthetically built `MIDIMessageEvent`s can have `data`
 * field equal to `null`, but when coming from the browser, they won't. The
 * default behavior is to defect on `null`.
 */
export const makeMessagesStream =
  Create.createStreamMakerFrom<MIDIInputEventMap>()(
    is,
    inputPort => ({
      tag: 'MIDIMessage',
      eventListener: {
        target: assumeImpl(inputPort)._port,
        type: 'midimessage',
      },
      spanAttributes: {
        spanTargetName: 'MIDI port',
        port: Util.getStaticMIDIPortInfo(inputPort),
      },
      nullableFieldName: 'data',
    }),
    midiMessage => ({ midiMessage }),
  )
