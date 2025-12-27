/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import {
  getInputPortByPortIdAndAccess,
  getOutputPortByPortIdAndAccess,
  getPortByPortIdAndAccess,
} from '../../getPortByPortId/getPortByPortIdAndAccess.ts'
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
