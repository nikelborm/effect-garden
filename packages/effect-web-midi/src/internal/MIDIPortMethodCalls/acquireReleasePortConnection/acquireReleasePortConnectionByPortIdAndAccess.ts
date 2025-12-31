// TODO: acquireReleasePortConnectionByPortIdAndAccess.ts
/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Get from '../../getPortByPortId/getPortByPortIdAndAccess.ts'
import { actOnPort } from '../actOnPort.ts'
import * as AR from './acquireReleasePortConnectionByPort.ts'

/**
 *
 */
export const acquireReleasePortConnectionByPortIdAndAccess = actOnPort(
  Get.getPortByPortIdAndAccess,
  AR.acquireReleasePortConnectionByPort,
)

/**
 *
 */
export const acquireReleaseInputConnectionByPortIdAndAccess = actOnPort(
  Get.getInputByPortIdAndAccess,
  AR.acquireReleaseInputConnectionByPort,
)

/**
 *
 */
export const acquireReleaseOutputConnectionByPortIdAndAccess = actOnPort(
  Get.getOutputByPortIdAndAccess,
  AR.acquireReleaseOutputConnectionByPort,
)
