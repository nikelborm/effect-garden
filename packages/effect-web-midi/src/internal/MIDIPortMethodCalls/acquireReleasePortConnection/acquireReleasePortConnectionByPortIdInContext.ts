import { flow } from 'effect/Function'

import * as Get from '../../getPortByPortId/getPortByPortIdInContext.ts'
import * as Acquire from './acquireReleasePortConnectionByPort.ts'

/**
 *
 */
export const acquireReleasePortConnectionByPortIdInContext = flow(
  Get.getPortByPortIdInContext,
  Acquire.acquireReleasePortConnectionByPort,
)

/**
 *
 */
export const acquireReleaseInputConnectionByPortIdInContext = flow(
  Get.getInputByPortIdInContext,
  Acquire.acquireReleaseInputConnectionByPort,
)

/**
 *
 */
export const acquireReleaseOutputConnectionByPortIdInContext = flow(
  Get.getOutputByPortIdInContext,
  Acquire.acquireReleaseOutputConnectionByPort,
)
