import * as EMIDIAccess from '../EMIDIAccess.ts'
import type * as EMIDIInput from '../EMIDIInput.ts'
import type * as EMIDIOutput from '../EMIDIOutput.ts'
import type * as EMIDIPort from '../EMIDIPort.ts'
import * as Get from './getPortByPortIdAndAccess.ts'

/**
 *
 *
 */
export const getPortByPortIdInContext = (id: EMIDIPort.BothId) =>
  Get.getPortByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

/**
 *
 *
 */
export const getInputByPortIdInContext = (id: EMIDIInput.Id) =>
  Get.getInputByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

/**
 *
 *
 */
export const getOutputByPortIdInContext = (id: EMIDIOutput.Id) =>
  Get.getOutputByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)
