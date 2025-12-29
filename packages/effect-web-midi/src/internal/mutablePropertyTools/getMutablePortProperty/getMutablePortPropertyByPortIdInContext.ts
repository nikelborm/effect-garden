import * as EMIDIAccess from '../../EMIDIAccess.ts'
import type * as EMIDIPort from '../../EMIDIPort.ts'
import * as Get from './getMutablePortPropertyByPortIdAndAccess.ts'

/**
 *
 *
 */
export const getPortDeviceStateByPortId = (id: EMIDIPort.BothId) =>
  Get.getPortDeviceStateByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

/**
 *
 *
 */
export const getPortConnectionStateByPortId = (id: EMIDIPort.BothId) =>
  Get.getPortConnectionStateByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

// TODO: getInputConnectionStateByPortId
export const getInputConnectionStateByPortId = () => {
  throw new Error('Not implemented 😿  YET!! 🤩')
}

// TODO: getInputDeviceStateByPortId
export const getInputDeviceStateByPortId = () => {
  throw new Error('Not implemented 😿  YET!! 🤩')
}

// TODO: getOutputConnectionStateByPortId
export const getOutputConnectionStateByPortId = () => {
  throw new Error('Not implemented 😿  YET!! 🤩')
}

// TODO: getOutputDeviceStateByPortId
export const getOutputDeviceStateByPortId = () => {
  throw new Error('Not implemented 😿  YET!! 🤩')
}
