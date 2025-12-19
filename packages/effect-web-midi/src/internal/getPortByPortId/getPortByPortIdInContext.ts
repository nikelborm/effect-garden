import * as EffectfulMIDIAccess from '../EffectfulMIDIAccess.ts'
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
  getPortByPortIdAndAccess(EffectfulMIDIAccess.EffectfulMIDIAccess, id)

/**
 *
 *
 */
export const getInputPortByPortIdInContext = (id: MIDIInputPortId) =>
  getInputPortByPortIdAndAccess(EffectfulMIDIAccess.EffectfulMIDIAccess, id)

/**
 *
 *
 */
export const getOutputPortByPortIdInContext = (id: MIDIOutputPortId) =>
  getOutputPortByPortIdAndAccess(EffectfulMIDIAccess.EffectfulMIDIAccess, id)
