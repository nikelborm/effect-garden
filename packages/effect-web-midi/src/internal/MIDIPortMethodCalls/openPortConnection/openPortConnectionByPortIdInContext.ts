import { flow } from 'effect/Function'
import {
  getInputPortByPortIdInContext,
  getOutputPortByPortIdInContext,
  getPortByPortIdInContext,
} from '../../getPortByPortId/getPortByPortIdInContext.ts'
import {
  openInputPortConnectionByPort,
  openOutputPortConnectionByPort,
  openPortConnectionByPort,
} from './openPortConnectionByPort.ts'

/**
 *
 */
export const openPortConnectionByPortIdInContext = flow(
  getPortByPortIdInContext,
  openPortConnectionByPort,
)

/**
 *
 */
export const openInputPortConnectionByPortIdInContext = flow(
  getInputPortByPortIdInContext,
  openInputPortConnectionByPort,
)

/**
 *
 */
export const openOutputPortConnectionByPortIdInContext = flow(
  getOutputPortByPortIdInContext,
  openOutputPortConnectionByPort,
)
