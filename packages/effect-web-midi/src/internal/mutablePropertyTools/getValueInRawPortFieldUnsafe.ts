import * as EMIDIPort from '../EMIDIPort.ts'
import type { MIDIPortMutableProperty } from './matchMutablePortProperty/matchMutablePortPropertyByPort.ts'

/**
 * @internal
 */
export const getValueInRawPortFieldUnsafe =
  <const TMIDIPortMutableProperty extends MIDIPortMutableProperty>(
    property: TMIDIPortMutableProperty,
  ) =>
  (port: EMIDIPort.EMIDIPort) =>
    EMIDIPort.assumeImpl(port)._port[property]
