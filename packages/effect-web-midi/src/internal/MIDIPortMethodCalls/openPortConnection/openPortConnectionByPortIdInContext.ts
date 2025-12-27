import { flow } from 'effect/Function'
import * as Get from '../../getPortByPortId/getPortByPortIdInContext.ts'
import * as Open from './openPortConnectionByPort.ts'

/**
 *
 */
export const openPortConnectionByPortIdInContext = flow(
  Get.getPortByPortIdInContext,
  Open.openPortConnectionByPort,
)

/**
 *
 */
export const openInputConnectionByPortIdInContext = flow(
  Get.getInputByPortIdInContext,
  Open.openInputConnectionByPort,
)

/**
 *
 */
export const openOutputConnectionByPortIdInContext = flow(
  Get.getOutputByPortIdInContext,
  Open.openOutputConnectionByPort,
)
