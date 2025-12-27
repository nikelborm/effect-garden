// TODO: acquireReleasePortConnectionByPortIdAndAccess.ts
/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import {
  getInputPortByPortIdAndAccess,
  getOutputPortByPortIdAndAccess,
  getPortByPortIdAndAccess,
} from '../../getPortByPortId/getPortByPortIdAndAccess.ts'
import { actOnPort } from '../actOnPort.ts'
import {
  acquireReleaseInputPortConnectionByPort,
  acquireReleaseOutputPortConnectionByPort,
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
export const acquireReleaseInputPortConnectionByPortIdAndAccess = actOnPort(
  getInputPortByPortIdAndAccess,
  acquireReleaseInputPortConnectionByPort,
)

/**
 *
 */
export const acquireReleaseOutputPortConnectionByPortIdAndAccess = actOnPort(
  getOutputPortByPortIdAndAccess,
  acquireReleaseOutputPortConnectionByPort,
)
