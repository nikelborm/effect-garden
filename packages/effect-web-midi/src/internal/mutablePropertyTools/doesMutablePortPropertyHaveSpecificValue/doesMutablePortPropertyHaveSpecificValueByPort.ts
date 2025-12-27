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
export const isInputDeviceConnectedByPort = EFunction.flow(
  Get.getInputDeviceStateByPort,
  Util.isDeviceConnected,
)

/**
 *
 */
export const isInputDeviceDisconnectedByPort = EFunction.flow(
  Get.getInputDeviceStateByPort,
  Util.isDeviceDisconnected,
)

/**
 *
 */
export const isInputConnectionOpenByPort = EFunction.flow(
  Get.getInputConnectionStateByPort,
  Util.isConnectionOpen,
)

/**
 *
 */
export const isInputConnectionPendingByPort = EFunction.flow(
  Get.getInputConnectionStateByPort,
  Util.isConnectionPending,
)

/**
 *
 */
export const isInputConnectionClosedByPort = EFunction.flow(
  Get.getInputConnectionStateByPort,
  Util.isConnectionClosed,
)

//////////////////////////////

/**
 *
 */
export const isOutputDeviceConnectedByPort = EFunction.flow(
  Get.getOutputDeviceStateByPort,
  Util.isDeviceConnected,
)

/**
 *
 */
export const isOutputDeviceDisconnectedByPort = EFunction.flow(
  Get.getOutputDeviceStateByPort,
  Util.isDeviceDisconnected,
)

/**
 *
 */
export const isOutputConnectionOpenByPort = EFunction.flow(
  Get.getOutputConnectionStateByPort,
  Util.isConnectionOpen,
)

/**
 *
 */
export const isOutputConnectionPendingByPort = EFunction.flow(
  Get.getOutputConnectionStateByPort,
  Util.isConnectionPending,
)

/**
 *
 */
export const isOutputConnectionClosedByPort = EFunction.flow(
  Get.getOutputConnectionStateByPort,
  Util.isConnectionClosed,
)
