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
export const closeInputConnectionByPortIdInContext = flow(
  Get.getInputByPortIdInContext,
  Close.closeInputConnectionByPort,
)

/**
 *
 */
export const closeOutputConnectionByPortIdInContext = flow(
  Get.getOutputByPortIdInContext,
  Close.closeOutputConnectionByPort,
)
