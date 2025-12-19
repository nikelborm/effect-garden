import { flow } from 'effect/Function'
import {
  getInputPortByPortIdInContext,
  getOutputPortByPortIdInContext,
  getPortByPortIdInContext,
} from '../../getPortByPortId/getPortByPortIdInContext.ts'
import {
  acquireReleaseInputPortConnectionByPort,
  acquireReleaseOutputPortConnectionByPort,
  acquireReleasePortConnectionByPort,
} from './acquireReleasePortConnectionByPort.ts'

/**
 *
 */
export const acquireReleasePortConnectionByPortIdInContext = flow(
  getPortByPortIdInContext,
  acquireReleasePortConnectionByPort,
)

/**
 *
 */
export const acquireReleaseInputPortConnectionByPortIdInContext = flow(
  getInputPortByPortIdInContext,
  acquireReleaseInputPortConnectionByPort,
)

/**
 *
 */
export const acquireReleaseOutputPortConnectionByPortIdInContext = flow(
  getOutputPortByPortIdInContext,
  acquireReleaseOutputPortConnectionByPort,
)
