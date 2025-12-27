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
export const getInputByPortIdInContext = (id: Util.MIDIInputId) =>
  Get.getInputByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

/**
 *
 *
 */
export const getOutputByPortIdInContext = (id: Util.MIDIOutputId) =>
  Get.getOutputByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)
