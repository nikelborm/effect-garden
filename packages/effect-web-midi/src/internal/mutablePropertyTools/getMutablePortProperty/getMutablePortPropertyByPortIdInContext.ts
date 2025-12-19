import * as EffectfulMIDIAccess from '../../EffectfulMIDIAccess.ts'
import type { MIDIBothPortId } from '../../util.ts'
import {
  getPortConnectionStateByPortIdAndAccess,
  getPortDeviceStateByPortIdAndAccess,
} from './getMutablePortPropertyByPortIdAndAccess.ts'

/**
 *
 *
 */
export const getPortDeviceStateByPortId = (id: MIDIBothPortId) =>
  getPortDeviceStateByPortIdAndAccess(
    EffectfulMIDIAccess.EffectfulMIDIAccess,
    id,
  )

/**
 *
 *
 */
export const getPortConnectionStateByPortId = (id: MIDIBothPortId) =>
  getPortConnectionStateByPortIdAndAccess(
    EffectfulMIDIAccess.EffectfulMIDIAccess,
    id,
  )

// TODO: other variants for inputs and outputs
