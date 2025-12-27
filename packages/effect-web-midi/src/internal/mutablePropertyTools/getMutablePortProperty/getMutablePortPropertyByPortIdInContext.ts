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

// TODO: getInputConnectionStateByPortId
export const getInputConnectionStateByPortId = () => {
  throw new Error('not implemented')
}

// TODO: getInputDeviceStateByPortId
export const getInputDeviceStateByPortId = () => {
  throw new Error('not implemented')
}

// TODO: getOutputConnectionStateByPortId
export const getOutputConnectionStateByPortId = () => {
  throw new Error('not implemented')
}

// TODO: getOutputDeviceStateByPortId
export const getOutputDeviceStateByPortId = () => {
  throw new Error('not implemented')
}
