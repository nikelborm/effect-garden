import { createStreamMakerFrom } from './createStreamMakerFrom.ts'
import * as EffectfulMIDIPort from './EffectfulMIDIPort.ts'
import { getStaticMIDIPortInfo } from './util.ts'

// TODO: implement scoping of midi access that will cleanup all message queues
// and streams, and remove listeners

// TODO: implement scope inheritance

/**
 * Thin wrapper around {@linkcode MIDIInput} instance. Will be seen in all of
 * the external code.
 */
export interface EffectfulMIDIInputPort
  extends EffectfulMIDIPort.EffectfulMIDIPort<'input'> {}

/**
 * Thin wrapper around {@linkcode MIDIInput} instance giving access to the
 * actual field storing it.
 * @internal
 */
interface EffectfulMIDIInputPortImpl
  extends EffectfulMIDIPort.EffectfulMIDIPortImpl<MIDIInput, 'input'> {}

/**
 * Validates the raw MIDI input port, and puts it into a field hidden from the
 * client's code
 *
 * @internal
 */
const makeImpl = (rawInputPort: MIDIInput): EffectfulMIDIInputPortImpl =>
  EffectfulMIDIPort.makeImpl(rawInputPort, 'input', MIDIInput)

/**
 * Asserts an object to be valid EffectfulMIDIInputPort and casts it to internal
 * implementation type
 *
 * @internal
 */
const assertImpl = (inputPort: unknown) => {
  if (!isImpl(inputPort))
    throw new Error('Failed to cast to EffectfulMIDIInputPortImpl')
  return inputPort
}

/**
 * Asserts an object to be valid EffectfulMIDIInputPort
 */
export const assert: (inputPort: unknown) => EffectfulMIDIInputPort = assertImpl

/**
 * @internal
 */
const assumeImpl = (inputPort: EffectfulMIDIInputPort) =>
  inputPort as EffectfulMIDIInputPortImpl

/**
 *
 *
 * @internal
 */
export const make: (rawInputPort: MIDIInput) => EffectfulMIDIInputPort =
  makeImpl

/**
 *
 *
 * @internal
 */
const isImpl: (inputPort: unknown) => inputPort is EffectfulMIDIInputPortImpl =
  EffectfulMIDIPort.isImplOfSpecificType('input', globalThis.MIDIInput)

/**
 *
 *
 */
export const is: (inputPort: unknown) => inputPort is EffectfulMIDIInputPort =
  isImpl

/**
 *
 *
 */
export const makeStateChangesStream =
  EffectfulMIDIPort.makeStateChangesStream as EffectfulMIDIPort.DualMakeStateChangesStream<'input'>

/**
 *
 */
export const matchConnectionState =
  EffectfulMIDIPort.matchMutableMIDIPortProperty('connection', is)

/**
 *
 */
export const matchDeviceState = EffectfulMIDIPort.matchMutableMIDIPortProperty(
  'state',
  is,
)

/**
 * [MIDIMessageEvent MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIMessageEvent)
 *
 * MIDI spec says that synthetically built `MIDIMessageEvent`s can have `data`
 * field equal to `null`, but when coming from the browser, the won't be. The
 * default behavior is to defect on `null`.
 */
export const makeMessagesStream = createStreamMakerFrom<MIDIInputEventMap>()(
  is,
  inputPort => ({
    tag: 'MIDIMessage',
    eventListener: { target: assumeImpl(inputPort)._port, type: 'midimessage' },
    spanAttributes: {
      spanTargetName: 'MIDI port',
      port: getStaticMIDIPortInfo(inputPort),
    },
    nullableFieldName: 'data',
  }),
  midiMessage => ({ midiMessage }),
)
