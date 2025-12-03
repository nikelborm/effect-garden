import { createStreamMakerFrom } from './createStreamMakerFrom.ts'
import * as EffectfulMIDIPort from './EffectfulMIDIPort.ts'
import { getStaticMIDIPortInfo } from './util.ts'

// TODO: implement scoping of midi access that will cleanup all message queues
// and streams, and remove listeners

// TODO: implement scope inheritance

/**
 * Wrapper around {@linkcode MIDIInput} instances
 */
export interface EffectfulMIDIInputPort
  extends EffectfulMIDIPort.EffectfulMIDIPort<'input'> {}

/**
 *
 *
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
const asImpl = (port: EffectfulMIDIInputPort) => {
  if (!isImpl(port))
    throw new Error('Failed to cast to EffectfulMIDIInputPortImpl')
  return port
}

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
const isImpl = EffectfulMIDIPort.isImplOfSpecificType('input', MIDIInput)

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
  EffectfulMIDIPort.makeStateChangesStream as EffectfulMIDIPort.DualStateChangesStreamMaker<'input'>

/**
 *
 */
export const matchConnectionState =
  EffectfulMIDIPort.matchMutableMIDIPortProperty('connection')<'input'>()

/**
 *
 */
export const matchDeviceState =
  EffectfulMIDIPort.matchMutableMIDIPortProperty('state')<'input'>()

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
    eventListener: { target: asImpl(inputPort)._port, type: 'midimessage' },
    spanAttributes: {
      spanTargetName: 'MIDI port',
      port: getStaticMIDIPortInfo(asImpl(inputPort)._port),
    },
    nullableFieldName: 'data',
  }),
  midiMessage => ({ midiMessage }),
)
