import * as EMIDIAccess from '../../EMIDIAccess.ts'
import type * as Util from '../../util.ts'
import * as Get from './getMutablePortPropertyByPortIdAndAccess.ts'

/**
 *
 *
 */
export const getPortDeviceStateByPortId = (id: Util.MIDIBothPortId) =>
  Get.getPortDeviceStateByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

/**
 *
 *
 */
export const getPortConnectionStateByPortId = (id: Util.MIDIBothPortId) =>
  Get.getPortConnectionStateByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

// TODO: getInputPortConnectionStateByPortId
export const getInputPortConnectionStateByPortId = () => {
  throw new Error('not implemented')
}

// TODO: getInputPortDeviceStateByPortId
export const getInputPortDeviceStateByPortId = () => {
  throw new Error('not implemented')
}

// TODO: getOutputPortConnectionStateByPortId
export const getOutputPortConnectionStateByPortId = () => {
  throw new Error('not implemented')
}

// TODO: getOutputPortDeviceStateByPortId
export const getOutputPortDeviceStateByPortId = () => {
  throw new Error('not implemented')
}
