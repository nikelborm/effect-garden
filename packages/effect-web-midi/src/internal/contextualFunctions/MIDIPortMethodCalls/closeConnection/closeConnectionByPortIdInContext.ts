import { flow } from 'effect/Function'
import {
  getInputPortByPortIdInContext,
  getOutputPortByPortIdInContext,
  getPortByPortIdInContext,
} from '../../getPortByPortId/getPortByPortIdInContext.ts'
import {
  closeInputPortConnectionByPort,
  closeOutputPortConnectionByPort,
  closePortConnectionByPort,
} from './closeConnectionByPort.ts'

/**
 *
 */
export const closePortConnectionByPortIdInContext = flow(
  getPortByPortIdInContext,
  closePortConnectionByPort,
)

/**
 *
 */
export const closeInputPortConnectionByPortIdInContext = flow(
  getInputPortByPortIdInContext,
  closeInputPortConnectionByPort,
)

/**
 *
 */
export const closeOutputPortConnectionByPortIdInContext = flow(
  getOutputPortByPortIdInContext,
  closeOutputPortConnectionByPort,
)
