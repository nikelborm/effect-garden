import * as EMIDIAccess from '../EMIDIAccess.ts'
import type * as Util from '../util.ts'
import * as Get from './getPortByPortIdAndAccess.ts'

/**
 *
 *
 */
export const getPortByPortIdInContext = (id: Util.MIDIBothPortId) =>
  Get.getPortByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

/**
 *
 *
 */
export const getInputPortByPortIdInContext = (id: Util.MIDIInputPortId) =>
  Get.getInputPortByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

/**
 *
 *
 */
export const getOutputPortByPortIdInContext = (id: Util.MIDIOutputPortId) =>
  Get.getOutputPortByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)
