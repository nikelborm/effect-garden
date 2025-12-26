import * as EMIDIAccess from '../EMIDIAccess.ts'
import type {
  MIDIBothPortId,
  MIDIInputPortId,
  MIDIOutputPortId,
} from '../util.ts'
import {
  getInputPortByPortIdAndAccess,
  getOutputPortByPortIdAndAccess,
  getPortByPortIdAndAccess,
} from './getPortByPortIdAndAccess.ts'

/**
 *
 *
 */
export const getPortByPortIdInContext = (id: MIDIBothPortId) =>
  getPortByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

/**
 *
 *
 */
export const getInputPortByPortIdInContext = (id: MIDIInputPortId) =>
  getInputPortByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)

/**
 *
 *
 */
export const getOutputPortByPortIdInContext = (id: MIDIOutputPortId) =>
  getOutputPortByPortIdAndAccess(EMIDIAccess.EMIDIAccess, id)
