import * as EMIDIAccess from '../../EMIDIAccess.ts'
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
  getPortDeviceStateByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

/**
 *
 *
 */
export const getPortConnectionStateByPortId = (id: MIDIBothPortId) =>
  getPortConnectionStateByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

// TODO: other variants for inputs and outputs
