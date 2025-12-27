export {
  acquireReleaseInputPortConnectionByPortIdAndAccess as acquireReleaseInputConnectionByIdInPipe,
  acquireReleaseOutputPortConnectionByPortIdAndAccess as acquireReleaseOutputConnectionByIdInPipe,
  acquireReleasePortConnectionByPortIdAndAccess as acquireReleasePortConnectionByIdInPipe,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPortIdAndAccess.ts'
export {
  acquireReleaseInputPortConnectionByPortIdInContext as acquireReleaseInputConnectionById,
  acquireReleaseOutputPortConnectionByPortIdInContext as acquireReleaseOutputConnectionById,
  acquireReleasePortConnectionByPortIdInContext as acquireReleasePortConnectionById,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPortIdInContext.ts'
export {
  closeInputPortConnectionByPortIdAndAccess as closeInputConnectionByIdInPipe,
  closeOutputPortConnectionByPortIdAndAccess as closeOutputConnectionByIdInPipe,
  closePortConnectionByPortIdAndAccess as closePortConnectionByIdInPipe,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPortIdAndAccess.ts'
export {
  closeInputPortConnectionByPortIdInContext as closeInputConnectionById,
  closeOutputPortConnectionByPortIdInContext as closeOutputConnectionById,
  closePortConnectionByPortIdInContext as closePortConnectionById,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPortIdInContext.ts'
export {
  openInputPortConnectionByPortIdAndAccess as openInputConnectionByIdInPipe,
  openOutputPortConnectionByPortIdAndAccess as openOutputConnectionByIdInPipe,
  openPortConnectionByPortIdAndAccess as openPortConnectionByIdInPipe,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPortIdAndAccess.ts'
export {
  openInputPortConnectionByPortIdInContext as openInputConnectionById,
  openOutputPortConnectionByPortIdInContext as openOutputConnectionById,
  openPortConnectionByPortIdInContext as openPortConnectionById,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPortIdInContext.ts'
export {
  getInputPortByPortIdInContext as getInputById,
  getOutputPortByPortIdInContext as getOutputById,
  getPortByPortIdInContext as getPortById,
} from './internal/getPortByPortId/getPortByPortIdInContext.ts'
export {
  type GetPortById,
  getInputPortByPortIdAndAccess as getInputByIdInPipe,
  getOutputPortByPortIdAndAccess as getOutputByIdInPipe,
  getPortByPortIdAndAccess as getPortByIdInPipe,
} from './internal/getPortByPortId/getPortByPortIdAndAccess.ts'
export {
  makeInputPortStateChangesStreamByPortIdAndAccess as makeInputStateChangesStreamByIdInPipe,
  makeOutputPortStateChangesStreamByPortIdAndAccess as makeOutputStateChangesStreamByIdInPipe,
  makePortStateChangesStreamByPortIdAndAccess as makePortStateChangesStreamByIdInPipe,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPortIdAndAccess.ts'
export {
  makeInputPortStateChangesStreamByPortIdInContext as makeInputStateChangesStreamById,
  makeOutputPortStateChangesStreamByPortIdInContext as makeOutputStateChangesStreamById,
  makePortStateChangesStreamByPortIdInContext as makePortStateChangesStreamById,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPortIdInContext.ts'
export {
  isInputPortConnectionClosedByPortIdAndAccess as isInputConnectionClosedByIdInPipe,
  isInputPortConnectionOpenByPortIdAndAccess as isInputConnectionOpenByIdInPipe,
  isInputPortConnectionPendingByPortIdAndAccess as isInputConnectionPendingByIdInPipe,
  isInputPortDeviceConnectedByPortIdAndAccess as isInputDeviceConnectedByIdInPipe,
  isInputPortDeviceDisconnectedByPortIdAndAccess as isInputDeviceDisconnectedByIdInPipe,
  isOutputPortConnectionClosedByPortIdAndAccess as isOutputConnectionClosedByIdInPipe,
  isOutputPortConnectionOpenByPortIdAndAccess as isOutputConnectionOpenByIdInPipe,
  isOutputPortConnectionPendingByPortIdAndAccess as isOutputConnectionPendingByIdInPipe,
  isOutputPortDeviceConnectedByPortIdAndAccess as isOutputDeviceConnectedByIdInPipe,
  isOutputPortDeviceDisconnectedByPortIdAndAccess as isOutputDeviceDisconnectedByIdInPipe,
  isPortConnectionClosedByPortIdAndAccess as isPortConnectionClosedByIdInPipe,
  isPortConnectionOpenByPortIdAndAccess as isPortConnectionOpenByIdInPipe,
  isPortConnectionPendingByPortIdAndAccess as isPortConnectionPendingByIdInPipe,
  isPortDeviceConnectedByPortIdAndAccess as isPortDeviceConnectedByIdInPipe,
  isPortDeviceDisconnectedByPortIdAndAccess as isPortDeviceDisconnectedByIdInPipe,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPortIdAndAccess.ts'
export {
  isInputPortConnectionClosedByPortIdInContext as isInputConnectionClosedById,
  isInputPortConnectionOpenByPortIdInContext as isInputConnectionOpenById,
  isInputPortConnectionPendingByPortIdInContext as isInputConnectionPendingById,
  isInputPortDeviceConnectedByPortIdInContext as isInputDeviceConnectedById,
  isInputPortDeviceDisconnectedByPortIdInContext as isInputDeviceDisconnectedById,
  isOutputPortConnectionClosedByPortIdInContext as isOutputConnectionClosedById,
  isOutputPortConnectionOpenByPortIdInContext as isOutputConnectionOpenById,
  isOutputPortConnectionPendingByPortIdInContext as isOutputConnectionPendingById,
  isOutputPortDeviceConnectedByPortIdInContext as isOutputDeviceConnectedById,
  isOutputPortDeviceDisconnectedByPortIdInContext as isOutputDeviceDisconnectedById,
  isPortConnectionClosedByPortIdInContext as isPortConnectionClosedById,
  isPortConnectionOpenByPortIdInContext as isPortConnectionOpenById,
  isPortConnectionPendingByPortIdInContext as isPortConnectionPendingById,
  isPortDeviceConnectedByPortIdInContext as isPortDeviceConnectedById,
  isPortDeviceDisconnectedByPortIdInContext as isPortDeviceDisconnectedById,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPortIdInContext.ts'
export {
  getInputPortConnectionStateByPortIdAndAccess as getInputConnectionStateByIdInPipe,
  getInputPortDeviceStateByPortIdAndAccess as getInputDeviceStateByIdInPipe,
  getOutputPortConnectionStateByPortIdAndAccess as getOutputConnectionStateByIdInPipe,
  getOutputPortDeviceStateByPortIdAndAccess as getOutputDeviceStateByIdInPipe,
  getPortConnectionStateByPortIdAndAccess as getPortConnectionStateByIdInPipe,
  getPortDeviceStateByPortIdAndAccess as getPortDeviceStateByIdInPipe,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPortIdAndAccess.ts'
export {
  getInputPortConnectionStateByPortId as getInputConnectionStateById,
  getInputPortDeviceStateByPortId as getInputDeviceStateById,
  getOutputPortConnectionStateByPortId as getOutputConnectionStateById,
  getOutputPortDeviceStateByPortId as getOutputDeviceStateById,
  getPortConnectionStateByPortId as getPortConnectionStateById,
  getPortDeviceStateByPortId as getPortDeviceStateById,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPortIdInContext.ts'
export {
  type DualMatchPortState,
  type MIDIPortMutableProperty,
  type MatchResult,
  type MatchStatePortFirst,
  type MatchStatePortLast,
  type MatcherConfigPlain,
  type PortStateHandler,
  type StateCaseToHandlerMap,
  matchInputPortConnectionStateByPort,
  matchInputPortDeviceStateByPort,
  matchOutputPortConnectionStateByPort,
  matchOutputPortDeviceStateByPort,
  matchPortConnectionStateByPort,
  matchPortDeviceStateByPort,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPort.ts'
export {
  matchInputPortConnectionStateByPortIdAndAccess as matchInputConnectionStateByIdInPipe,
  matchInputPortDeviceStateByPortIdAndAccess as matchInputDeviceStateByIdInPipe,
  matchOutputPortConnectionStateByPortIdAndAccess as matchOutputConnectionStateByIdInPipe,
  matchOutputPortDeviceStateByPortIdAndAccess as matchOutputDeviceStateByIdInPipe,
  matchPortConnectionStateByPortIdAndAccess as matchPortConnectionStateBydInPipe,
  matchPortDeviceStateByPortIdAndAccess as matchPortDeviceStateByIdInPipe,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPortIdAndAccess.ts'
export {
  matchInputPortConnectionStateByPortIdInContext as matchInputConnectionStateById,
  matchInputPortDeviceStateByPortIdInContext as matchInputDeviceStateById,
  matchOutputPortConnectionStateByPortIdInContext as matchOutputConnectionStateById,
  matchOutputPortDeviceStateByPortIdInContext as matchOutputDeviceStateById,
  matchPortConnectionStateByPortIdInContext as matchPortConnectionStateById,
  matchPortDeviceStateByPortIdInContext as matchPortDeviceStateByPortId,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPortIdInContext.ts'

export {} from './internal/EMIDIInputPort.ts'
export {} from './internal/EMIDIOutputPort.ts'
export {} from './internal/EMIDIPort.ts'

export {
  AllPortsRecord,
  assert,
  type DualSendMIDIMessageFromAccess,
  EMIDIAccess,
  type EMIDIAccessInstance,
  getAllPortsRecord,
  getInputPortsRecord,
  getOutputPortsRecord,
  InputPortsRecord,
  is,
  layer,
  layerMostRestricted,
  layerSoftwareSynthSupported,
  layerSystemExclusiveAndSoftwareSynthSupported,
  layerSystemExclusiveSupported,
  makeAllPortsStateChangesStream,
  OutputPortsRecord,
  type PolymorphicAccessInstance,
  type RequestMIDIAccessOptions,
  request,
  type SendFromAccessArgs,
  type SendMIDIMessageAccessFirst,
  type SendMIDIMessageAccessLast,
  type SentMessageEffectFromAccess,
  send,
  type TargetPortSelector,
  type TypeId,
  type PolymorphicAccessInstanceClean,
  clearPortById,
  makeAllPortsStateChangesStreamFromContext,
  makeMessagesStreamByPortId,
  sendFromContext,
  sendToPortById,
} from './internal/EMIDIAccess.ts'
