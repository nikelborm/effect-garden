import * as EffectfulMIDIAccess from '../../../EffectfulMIDIAccess.ts'
import type { MIDIBothPortId } from '../../../util.ts'

/**
 *
 *
 */
export const getPortDeviceStateByPortId = (id: MIDIBothPortId) =>
  EffectfulMIDIAccess.getPortDeviceState(
    EffectfulMIDIAccess.EffectfulMIDIAccess,
    id,
  )

/**
 *
 *
 */
export const getPortConnectionStateByPortId = (id: MIDIBothPortId) =>
  EffectfulMIDIAccess.getPortConnectionState(
    EffectfulMIDIAccess.EffectfulMIDIAccess,
    id,
  )
