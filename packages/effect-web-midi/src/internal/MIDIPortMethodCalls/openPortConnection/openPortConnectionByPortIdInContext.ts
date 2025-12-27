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
export const openInputPortConnectionByPortIdInContext = flow(
  Get.getInputPortByPortIdInContext,
  Open.openInputPortConnectionByPort,
)

/**
 *
 */
export const openOutputPortConnectionByPortIdInContext = flow(
  Get.getOutputPortByPortIdInContext,
  Open.openOutputPortConnectionByPort,
)
