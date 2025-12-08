import { createStreamMakerFrom } from './createStreamMakerFrom.ts'
import * as EffectfulMIDIAccess from './EffectfulMIDIAccess.ts'
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
const makeImpl = (port: MIDIInput): EffectfulMIDIInputPortImpl =>
  EffectfulMIDIPort.makeImpl(port, 'input', MIDIInput)

/**
 * Asserts an object to be valid EffectfulMIDIInputPort and casts it to internal
 * implementation type
 *
 * @internal
 */
const assertImpl = (port: unknown) => {
  if (!isImpl(port))
    throw new Error('Failed to cast to EffectfulMIDIInputPortImpl')
  return port
}

/**
 * Asserts an object to be valid EffectfulMIDIInputPort
 */
export const assert: (port: unknown) => EffectfulMIDIInputPort = assertImpl

/**
 * @internal
 */
const assumeImpl = (port: EffectfulMIDIInputPort) =>
  port as EffectfulMIDIInputPortImpl

/**
 *
 *
 * @internal
 */
export const make: (port: MIDIInput) => EffectfulMIDIInputPort = makeImpl

/**
 *
 *
 * @internal
 */
const isImpl: (port: unknown) => port is EffectfulMIDIInputPortImpl =
  EffectfulMIDIPort.isImplOfSpecificType('input', MIDIInput)

/**
 *
 *
 */
export const is: (port: unknown) => port is EffectfulMIDIInputPort = isImpl

/**
 *
 *
 */
export const makeStateChangesStream =
  EffectfulMIDIPort.makeStateChangesStream as EffectfulMIDIPort.DualMakeStateChangesStream<'input'>

/**
 *
 */
export const makeStateChangesStreamById =
  EffectfulMIDIAccess.makeInputPortStateChangesStreamByPortId

/**
 *
 */
export const matchConnectionState =
  EffectfulMIDIPort.matchMutableMIDIPortProperty('connection', is)

/**
 *
 */
export const matchConnectionStateById =
  EffectfulMIDIAccess.matchInputPortConnectionStateByPortId

/**
 *
 */
export const matchDeviceState = EffectfulMIDIPort.matchMutableMIDIPortProperty(
  'state',
  is,
)

/**
 *
 */
export const matchDeviceStateById =
  EffectfulMIDIAccess.matchInputPortDeviceStateByPortId

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

/**
 *
 */
export const makeMessagesStreamById =
  EffectfulMIDIAccess.makeMessagesStreamByPortId
