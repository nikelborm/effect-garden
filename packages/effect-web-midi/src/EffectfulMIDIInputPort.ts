import {
  createStreamMakerFrom,
  makeStreamFromWrapped,
} from './createStreamMakerFrom.ts'
import * as EffectfulMIDIPort from './EffectfulMIDIPort.ts'
import { getStaticMIDIPortInfo } from './util.ts'

// TODO: implement scoping of midi access that will cleanup all message queues
// and streams, and remove listeners

// TODO: implement scope inheritance

const makeImpl = (port: MIDIInput): EffectfulMIDIInputPortImpl =>
  EffectfulMIDIPort.makeImpl(port, 'input', MIDIInput)

const asImpl = (port: EffectfulMIDIInputPort) => {
  if (!isImpl(port))
    throw new Error('Failed to cast to EffectfulMIDIInputPortImpl')
  return port
}

export const make: (port: MIDIInput) => EffectfulMIDIInputPort = makeImpl

const isImpl = EffectfulMIDIPort.isImplOfSpecificType('input', MIDIInput)

export const is: (
  port: unknown,
) => port is EffectfulMIDIPort.EffectfulMIDIPort<'input'> = isImpl

export interface EffectfulMIDIInputPort
  extends EffectfulMIDIPort.EffectfulMIDIPort<'input'> {}

/** @internal */
export interface EffectfulMIDIInputPortImpl
  extends EffectfulMIDIPort.EffectfulMIDIPortImpl<MIDIInput, 'input'> {}

export const makeStateChangesStream =
  EffectfulMIDIPort.makeStateChangesStream as EffectfulMIDIPort.DualStateChangesStreamMaker<'input'>

export const makeStateChangesStreamFromWrapped =
  EffectfulMIDIPort.makeStateChangesStreamFromWrapped as EffectfulMIDIPort.DualStateChangesStreamMakerFromWrapped<'input'>

/**
 * [MIDIMessageEvent MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIMessageEvent)
 *
 * MIDI spec says that synthetically built messages can have `data` field
 * equal to null, but in all other normal cases it's not. The default behavior
 * is to die on null.
 */
export const makeMessagesStream = createStreamMakerFrom<MIDIInputEventMap>()(
  is,
  self => ({
    tag: 'MIDIMessage',
    eventListener: { target: asImpl(self)._port, type: 'midimessage' },
    spanAttributes: {
      spanTargetName: 'MIDI port',
      port: getStaticMIDIPortInfo(asImpl(self)._port),
    },
    cameFrom: self,
    nullableFieldName: 'data',
  }),
  data => ({ data }),
)

export const makeMessagesStreamFromWrapped =
  makeStreamFromWrapped(makeMessagesStream)
