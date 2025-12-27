/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import {
  getInputByPortIdAndAccess,
  getOutputByPortIdAndAccess,
  getPortByPortIdAndAccess,
} from '../../getPortByPortId/getPortByPortIdAndAccess.ts'
import { actOnPort } from '../actOnPort.ts'
import {
  openInputConnectionByPort,
  openOutputConnectionByPort,
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
export const openInputConnectionByPortIdAndAccess = actOnPort(
  getInputByPortIdAndAccess,
  openInputConnectionByPort,
)

/**
 *
 */
export const openOutputConnectionByPortIdAndAccess = actOnPort(
  getOutputByPortIdAndAccess,
  openOutputConnectionByPort,
)
