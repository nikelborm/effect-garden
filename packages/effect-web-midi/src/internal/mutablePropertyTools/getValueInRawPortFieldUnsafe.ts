import * as EffectfulMIDIPort from '../EffectfulMIDIPort.ts'
import type { MIDIPortMutableProperty } from './matchMutablePortProperty/matchMutablePortPropertyByPort.ts'

/**
 * @internal
 */
export const getValueInRawPortFieldUnsafe =
  <const TMIDIPortMutableProperty extends MIDIPortMutableProperty>(
    property: TMIDIPortMutableProperty,
  ) =>
  (port: EffectfulMIDIPort.EffectfulMIDIPort) =>
    EffectfulMIDIPort.assumeImpl(port)._port[property]
