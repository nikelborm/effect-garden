import * as EFunction from 'effect/Function'
import * as Get from '../../getPortByPortId/getPortByPortIdInContext.ts'
import * as Check from './doesMutablePortPropertyHaveSpecificValueByPort.ts'

/**
 *
 */
export const closePortConnectionByPortIdInContext = EFunction.flow(
  Get.getInputByPortIdInContext,
  Check.isInputConnectionClosedByPort,
)

/**
 *
 */
export const isInputConnectionClosedByPortIdInContext = EFunction.flow(
  Get.getInputByPortIdInContext,
  Check.isInputConnectionClosedByPort,
)

/**
 *
 */
export const isInputConnectionOpenByPortIdInContext = EFunction.flow(
  Get.getInputByPortIdInContext,
  Check.isInputConnectionClosedByPort,
)

/**
 *
 */
export const isInputConnectionPendingByPortIdInContext = EFunction.flow(
  Get.getInputByPortIdInContext,
  Check.isInputConnectionClosedByPort,
)

/**
 *
 */
export const isInputDeviceConnectedByPortIdInContext = EFunction.flow(
  Get.getInputByPortIdInContext,
  Check.isInputConnectionClosedByPort,
)

/**
 *
 */
export const isInputDeviceDisconnectedByPortIdInContext = EFunction.flow(
  Get.getInputByPortIdInContext,
  Check.isInputConnectionClosedByPort,
)

/**
 *
 */
export const isOutputConnectionClosedByPortIdInContext = EFunction.flow(
  Get.getOutputByPortIdInContext,
  Check.isOutputConnectionClosedByPort,
)

/**
 *
 */
export const isOutputConnectionOpenByPortIdInContext = EFunction.flow(
  Get.getOutputByPortIdInContext,
  Check.isOutputConnectionClosedByPort,
)

/**
 *
 */
export const isOutputConnectionPendingByPortIdInContext = EFunction.flow(
  Get.getOutputByPortIdInContext,
  Check.isOutputConnectionClosedByPort,
)

/**
 *
 */
export const isOutputDeviceConnectedByPortIdInContext = EFunction.flow(
  Get.getOutputByPortIdInContext,
  Check.isOutputConnectionClosedByPort,
)

/**
 *
 */
export const isOutputDeviceDisconnectedByPortIdInContext = EFunction.flow(
  Get.getOutputByPortIdInContext,
  Check.isOutputConnectionClosedByPort,
)

/**
 *
 */
export const isPortConnectionClosedByPortIdInContext = EFunction.flow(
  Get.getPortByPortIdInContext,
  Check.isPortConnectionClosedByPort,
)

/**
 *
 */
export const isPortConnectionOpenByPortIdInContext = EFunction.flow(
  Get.getPortByPortIdInContext,
  Check.isPortConnectionClosedByPort,
)

/**
 *
 */
export const isPortConnectionPendingByPortIdInContext = EFunction.flow(
  Get.getPortByPortIdInContext,
  Check.isPortConnectionClosedByPort,
)

/**
 *
 */
export const isPortDeviceConnectedByPortIdInContext = EFunction.flow(
  Get.getPortByPortIdInContext,
  Check.isPortConnectionClosedByPort,
)

/**
 *
 */
export const isPortDeviceDisconnectedByPortIdInContext = EFunction.flow(
  Get.getPortByPortIdInContext,
  Check.isPortConnectionClosedByPort,
)
