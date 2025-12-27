import { flow } from 'effect/Function'
import * as Get from '../../getPortByPortId/getPortByPortIdInContext.ts'
import * as Close from './closePortConnectionByPort.ts'

/**
 *
 */
export const closePortConnectionByPortIdInContext = flow(
  Get.getPortByPortIdInContext,
  Close.closePortConnectionByPort,
)

/**
 *
 */
export const closeInputPortConnectionByPortIdInContext = flow(
  Get.getInputPortByPortIdInContext,
  Close.closeInputPortConnectionByPort,
)

/**
 *
 */
export const closeOutputPortConnectionByPortIdInContext = flow(
  Get.getOutputPortByPortIdInContext,
  Close.closeOutputPortConnectionByPort,
)
