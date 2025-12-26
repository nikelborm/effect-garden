/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import { flow, dual, pipe } from 'effect/Function'
import * as EMIDIInputPort from '../../EMIDIInputPort.ts'
import * as EMIDIOutputPort from '../../EMIDIOutputPort.ts'
import * as EMIDIAccess from '../../EMIDIAccess.ts'
import * as EMIDIPort from '../../EMIDIPort.ts'
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
