import { flow } from 'effect/Function'
import {
  isConnectionClosed,
  isConnectionOpen,
  isConnectionPending,
  isDeviceConnected,
  isDeviceDisconnected,
} from '../../../util.ts'
import {
  getInputPortConnectionStateByPort,
  getInputPortDeviceStateByPort,
  getOutputPortConnectionStateByPort,
  getOutputPortDeviceStateByPort,
  getPortConnectionStateByPort,
  getPortDeviceStateByPort,
} from '../getMutablePortProperty/getMutablePortPropertyByPort.ts'

/**
 *
 */
export const isPortDeviceConnectedByPort = flow(
  getPortDeviceStateByPort,
  isDeviceConnected,
)

/**
 *
 */
export const isPortDeviceDisconnectedByPort = flow(
  getPortDeviceStateByPort,
  isDeviceDisconnected,
)

/**
 *
 */
export const isPortConnectionOpenByPort = flow(
  getPortConnectionStateByPort,
  isConnectionOpen,
)

/**
 *
 */
export const isPortConnectionPendingByPort = flow(
  getPortConnectionStateByPort,
  isConnectionPending,
)

/**
 *
 */
export const isPortConnectionClosedByPort = flow(
  getPortConnectionStateByPort,
  isConnectionClosed,
)

//////////////////////////////

/**
 *
 */
export const isInputPortDeviceConnectedByPort = flow(
  getInputPortDeviceStateByPort,
  isDeviceConnected,
)

/**
 *
 */
export const isInputPortDeviceDisconnectedByPort = flow(
  getInputPortDeviceStateByPort,
  isDeviceDisconnected,
)

/**
 *
 */
export const isInputPortConnectionOpenByPort = flow(
  getInputPortConnectionStateByPort,
  isConnectionOpen,
)

/**
 *
 */
export const isInputPortConnectionPendingByPort = flow(
  getInputPortConnectionStateByPort,
  isConnectionPending,
)

/**
 *
 */
export const isInputPortConnectionClosedByPort = flow(
  getInputPortConnectionStateByPort,
  isConnectionClosed,
)

//////////////////////////////

/**
 *
 */
export const isOutputPortDeviceConnectedByPort = flow(
  getOutputPortDeviceStateByPort,
  isDeviceConnected,
)

/**
 *
 */
export const isOutputPortDeviceDisconnectedByPort = flow(
  getOutputPortDeviceStateByPort,
  isDeviceDisconnected,
)

/**
 *
 */
export const isOutputPortConnectionOpenByPort = flow(
  getOutputPortConnectionStateByPort,
  isConnectionOpen,
)

/**
 *
 */
export const isOutputPortConnectionPendingByPort = flow(
  getOutputPortConnectionStateByPort,
  isConnectionPending,
)

/**
 *
 */
export const isOutputPortConnectionClosedByPort = flow(
  getOutputPortConnectionStateByPort,
  isConnectionClosed,
)
