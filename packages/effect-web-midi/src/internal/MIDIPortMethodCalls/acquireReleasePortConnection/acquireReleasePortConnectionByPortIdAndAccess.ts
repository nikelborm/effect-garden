// TODO: acquireReleasePortConnectionByPortIdAndAccess.ts
/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import {
  getInputByPortIdAndAccess,
  getOutputByPortIdAndAccess,
  getPortByPortIdAndAccess,
} from '../../getPortByPortId/getPortByPortIdAndAccess.ts'
import { actOnPort } from '../actOnPort.ts'
import {
  acquireReleaseInputConnectionByPort,
  acquireReleaseOutputConnectionByPort,
  acquireReleasePortConnectionByPort,
} from './acquireReleasePortConnectionByPort.ts'

/**
 *
 */
export const acquireReleasePortConnectionByPortIdAndAccess = actOnPort(
  getPortByPortIdAndAccess,
  acquireReleasePortConnectionByPort,
)

/**
 *
 */
export const acquireReleaseInputConnectionByPortIdAndAccess = actOnPort(
  getInputByPortIdAndAccess,
  acquireReleaseInputConnectionByPort,
)

/**
 *
 */
export const acquireReleaseOutputConnectionByPortIdAndAccess = actOnPort(
  getOutputByPortIdAndAccess,
  acquireReleaseOutputConnectionByPort,
)
