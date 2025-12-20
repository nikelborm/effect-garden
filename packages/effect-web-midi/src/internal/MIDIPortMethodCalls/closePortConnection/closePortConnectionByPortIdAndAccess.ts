/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import { flow, dual, pipe } from 'effect/Function'
import * as EffectfulMIDIInputPort from '../../EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from '../../EffectfulMIDIOutputPort.ts'
import * as EffectfulMIDIAccess from '../../EffectfulMIDIAccess.ts'
import * as EffectfulMIDIPort from '../../EffectfulMIDIPort.ts'
import {
  getInputPortByPortIdAndAccess,
  getOutputPortByPortIdAndAccess,
  getPortByPortIdAndAccess,
  type GetPortById,
  type GetPortByIdAccessFirst,
} from '../../getPortByPortId/getPortByPortIdAndAccess.ts'
import { makeMIDIPortMethodCallerFactory } from '../makeMIDIPortMethodCallerFactory.ts'
import type { MIDIBothPortId, MIDIPortId } from '../../util.ts'
import * as Effect from 'effect/Effect'
import type { PortNotFoundError } from '../../errors.ts'
import { actOnPort } from '../actOnPort.ts'
import {
  closeInputPortConnectionByPort,
  closeOutputPortConnectionByPort,
  closePortConnectionByPort,
} from './closePortConnectionByPort.ts'

/**
 *
 */
export const closePortConnectionByPortIdAndAccess = actOnPort(
  getPortByPortIdAndAccess,
  closePortConnectionByPort,
)

/**
 *
 */
export const closeInputPortConnectionByPortIdAndAccess = actOnPort(
  getInputPortByPortIdAndAccess,
  closeInputPortConnectionByPort,
)

/**
 *
 */
export const closeOutputPortConnectionByPortIdAndAccess = actOnPort(
  getOutputPortByPortIdAndAccess,
  closeOutputPortConnectionByPort,
)
