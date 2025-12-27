/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import {
  getInputByPortIdAndAccess,
  getOutputByPortIdAndAccess,
  getPortByPortIdAndAccess,
} from '../../getPortByPortId/getPortByPortIdAndAccess.ts'
import { actOnPort } from '../actOnPort.ts'
import {
  closeInputConnectionByPort,
  closeOutputConnectionByPort,
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
export const closeInputConnectionByPortIdAndAccess = actOnPort(
  getInputByPortIdAndAccess,
  closeInputConnectionByPort,
)

/**
 *
 */
export const closeOutputConnectionByPortIdAndAccess = actOnPort(
  getOutputByPortIdAndAccess,
  closeOutputConnectionByPort,
)
