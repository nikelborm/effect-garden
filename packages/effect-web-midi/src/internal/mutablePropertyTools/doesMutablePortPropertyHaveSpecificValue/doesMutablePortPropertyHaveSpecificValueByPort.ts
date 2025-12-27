import * as EFunction from 'effect/Function'
import * as Util from '../../util.ts'
import * as Get from '../getMutablePortProperty/getMutablePortPropertyByPort.ts'

/**
 *
 */
export const isPortDeviceConnectedByPort = EFunction.flow(
  Get.getPortDeviceStateByPort,
  Util.isDeviceConnected,
)

/**
 *
 */
export const isPortDeviceDisconnectedByPort = EFunction.flow(
  Get.getPortDeviceStateByPort,
  Util.isDeviceDisconnected,
)

/**
 *
 */
export const isPortConnectionOpenByPort = EFunction.flow(
  Get.getPortConnectionStateByPort,
  Util.isConnectionOpen,
)

/**
 *
 */
export const isPortConnectionPendingByPort = EFunction.flow(
  Get.getPortConnectionStateByPort,
  Util.isConnectionPending,
)

/**
 *
 */
export const isPortConnectionClosedByPort = EFunction.flow(
  Get.getPortConnectionStateByPort,
  Util.isConnectionClosed,
)

//////////////////////////////

/**
 *
 */
export const isInputPortDeviceConnectedByPort = EFunction.flow(
  Get.getInputPortDeviceStateByPort,
  Util.isDeviceConnected,
)

/**
 *
 */
export const isInputPortDeviceDisconnectedByPort = EFunction.flow(
  Get.getInputPortDeviceStateByPort,
  Util.isDeviceDisconnected,
)

/**
 *
 */
export const isInputPortConnectionOpenByPort = EFunction.flow(
  Get.getInputPortConnectionStateByPort,
  Util.isConnectionOpen,
)

/**
 *
 */
export const isInputPortConnectionPendingByPort = EFunction.flow(
  Get.getInputPortConnectionStateByPort,
  Util.isConnectionPending,
)

/**
 *
 */
export const isInputPortConnectionClosedByPort = EFunction.flow(
  Get.getInputPortConnectionStateByPort,
  Util.isConnectionClosed,
)

//////////////////////////////

/**
 *
 */
export const isOutputPortDeviceConnectedByPort = EFunction.flow(
  Get.getOutputPortDeviceStateByPort,
  Util.isDeviceConnected,
)

/**
 *
 */
export const isOutputPortDeviceDisconnectedByPort = EFunction.flow(
  Get.getOutputPortDeviceStateByPort,
  Util.isDeviceDisconnected,
)

/**
 *
 */
export const isOutputPortConnectionOpenByPort = EFunction.flow(
  Get.getOutputPortConnectionStateByPort,
  Util.isConnectionOpen,
)

/**
 *
 */
export const isOutputPortConnectionPendingByPort = EFunction.flow(
  Get.getOutputPortConnectionStateByPort,
  Util.isConnectionPending,
)

/**
 *
 */
export const isOutputPortConnectionClosedByPort = EFunction.flow(
  Get.getOutputPortConnectionStateByPort,
  Util.isConnectionClosed,
)
