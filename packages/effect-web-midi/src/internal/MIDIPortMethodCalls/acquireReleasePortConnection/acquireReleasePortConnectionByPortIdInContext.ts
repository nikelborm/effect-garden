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
export const acquireReleaseInputPortConnectionByPortIdInContext = flow(
  Get.getInputPortByPortIdInContext,
  Acquire.acquireReleaseInputPortConnectionByPort,
)

/**
 *
 */
export const acquireReleaseOutputPortConnectionByPortIdInContext = flow(
  Get.getOutputPortByPortIdInContext,
  Acquire.acquireReleaseOutputPortConnectionByPort,
)
