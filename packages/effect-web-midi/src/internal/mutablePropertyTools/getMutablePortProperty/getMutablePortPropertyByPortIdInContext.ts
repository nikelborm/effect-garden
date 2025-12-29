import * as EMIDIAccess from '../../EMIDIAccess.ts'
import type * as EMIDIInput from '../../EMIDIInput.ts'
import type * as EMIDIOutput from '../../EMIDIOutput.ts'
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

/**
 *
 *
 */
export const getInputDeviceStateByPortId = (id: EMIDIInput.Id) =>
  Get.getInputDeviceStateByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

/**
 *
 *
 */
export const getInputConnectionStateByPortId = (id: EMIDIInput.Id) =>
  Get.getInputConnectionStateByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

/**
 *
 *
 */
export const getOutputDeviceStateByPortId = (id: EMIDIOutput.Id) =>
  Get.getOutputDeviceStateByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

/**
 *
 *
 */
export const getOutputConnectionStateByPortId = (id: EMIDIOutput.Id) =>
  Get.getOutputConnectionStateByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)
