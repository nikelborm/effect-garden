/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import {
  getInputPortByPortIdAndAccess,
  getOutputPortByPortIdAndAccess,
  getPortByPortIdAndAccess,
} from '../../getPortByPortId/getPortByPortIdAndAccess.ts'
import { actOnPort } from '../actOnPort.ts'
import {
  openInputPortConnectionByPort,
  openOutputPortConnectionByPort,
  openPortConnectionByPort,
} from './openPortConnectionByPort.ts'

/**
 *
 */
export const openPortConnectionByPortIdAndAccess = actOnPort(
  getPortByPortIdAndAccess,
  openPortConnectionByPort,
)

/**
 *
 */
export const openInputPortConnectionByPortIdAndAccess = actOnPort(
  getInputPortByPortIdAndAccess,
  openInputPortConnectionByPort,
)

/**
 *
 */
export const openOutputPortConnectionByPortIdAndAccess = actOnPort(
  getOutputPortByPortIdAndAccess,
  openOutputPortConnectionByPort,
)
