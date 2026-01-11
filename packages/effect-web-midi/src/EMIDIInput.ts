export {
  // type AcquiredThing,
  // AllPortsRecord,
  // assert,
  // assumeImpl,
  // clearPortById,
  // type DualSendMIDIMessageFromAccess,
  // EMIDIAccess,
  // type EMIDIAccessInstance,
  // type GetThingByPortId,
  // type GetThingByPortIdAccessFirst,
  // type GetThingByPortIdAccessLast,
  // type GetThingByPortIdAccessLastSecondHalf,
  // getAllPortsRecord,
  getInputsArray as getArray,
  getInputsRecord as getRecord,
  // getOutputsRecord,
  InputsArray as Array,
  InputsRecord as Record,
  // is,
  // layer,
  // layerMostRestricted,
  // layerSoftwareSynthSupported,
  // layerSystemExclusiveAndSoftwareSynthSupported,
  // layerSystemExclusiveSupported,
  // makeAllPortsStateChangesStream,
  // makeAllPortsStateChangesStreamInContext,
  makeMessagesStreamByInputId as makeMessagesStreamById,
  makeMessagesStreamByInputIdAndAccess as makeMessagesStreamByIdAndAccess,
  // OutputsRecord,
  // type PolymorphicAccessInstance,
  // type PolymorphicAccessInstanceClean,
  // type RequestMIDIAccessOptions,
  // request,
  // resolve,
  // type SendFromAccessArgs,
  // type SendMIDIMessageAccessFirst,
  // type SendMIDIMessageAccessLast,
  // type SentMessageEffectFromAccess,
  // send,
  // sendInContext,
  // sendToPortById,
  // type TargetPortSelector,
  // type TypeId,
} from './internal/EMIDIAccess.ts'
export {
  // make,
  assert,
  type EMIDIInput,
  Id,
  type InputIdToInstanceMap as IdToInstanceMap,
  is,
  makeMessagesStreamByPort as makeMessagesStream,
  type PolymorphicInput,
  type PolymorphicInputClean,
} from './internal/EMIDIInput.ts'
// export {
//   assert,
//   clear,
//   type DualSendMIDIMessageFromPort,
//   type EMIDIOutput,
//   is,
//   make,
//   type PolymorphicOutput,
//   type PolymorphicOutputClean,
//   type SendFromPortArgs,
//   type SendMIDIMessagePortFirst,
//   type SendMIDIMessagePortLast,
//   type SentMessageEffectFromPort,
//   send,
// } from './internal/EMIDIOutput.ts'
// export {
//   assert,
//   assumeImpl,
//   type EMIDIPort,
//   type EMIDIPortImpl,
//   type ExtractTypeFromPort,
//   is,
//   isImplOfSpecificType,
//   makeImpl,
//   type PolymorphicPort,
//   type PolymorphicPortClean,
//   type TypeId,
// } from './internal/EMIDIPort.ts'
export {
  // type GetPortById,
  getInputByPortIdAndAccess as getByIdAndAccess,
  // getOutputByPortIdAndAccess,
  // getPortByPortIdAndAccess,
} from './internal/getPortByPortId/getPortByPortIdAndAccess.ts'
export {
  getInputByPortIdInContext as getById,
  // getOutputByPortIdInContext,
  // getPortByPortIdInContext,
} from './internal/getPortByPortId/getPortByPortIdInContext.ts'
export {
  acquireReleaseInputConnectionByPort as acquireReleaseConnection,
  // acquireReleaseOutputConnectionByPort,
  // acquireReleasePortConnectionByPort,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPort.ts'
export {
  acquireReleaseInputConnectionByPortIdAndAccess as acquireReleaseConnectionByIdAndAccess,
  // acquireReleaseOutputConnectionByPortIdAndAccess,
  // acquireReleasePortConnectionByPortIdAndAccess,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPortIdAndAccess.ts'
export {
  acquireReleaseInputConnectionByPortIdInContext as acquireReleaseConnectionById,
  // acquireReleaseOutputConnectionByPortIdInContext,
  // acquireReleasePortConnectionByPortIdInContext,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPortIdInContext.ts'
// export { actOnPort } from './internal/MIDIPortMethodCalls/actOnPort.ts'
export {
  closeInputConnectionByPort as closeConnection,
  // closeOutputConnectionByPort,
  // closePortConnectionByPort,
  // makePortConnectionCloser,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPort.ts'
export {
  closeInputConnectionByPortIdAndAccess as closeConnectionByIdAndAccess,
  // closeOutputConnectionByPortIdAndAccess,
  // closePortConnectionByPortIdAndAccess,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPortIdAndAccess.ts'
export {
  closeInputConnectionByPortIdInContext as closeConnectionById,
  // closeOutputConnectionByPortIdInContext,
  // closePortConnectionByPortIdInContext,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPortIdInContext.ts'
// export {
//   makeMIDIPortMethodCallerFactory,
//   type TouchPort,
// } from './internal/MIDIPortMethodCalls/makeMIDIPortMethodCallerFactory.ts'
export {
  // makePortConnectionOpener,
  openInputConnectionByPort as openConnection,
  // openOutputConnectionByPort,
  // openPortConnectionByPort,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPort.ts'
export {
  openInputConnectionByPortIdAndAccess as openConnectionByIdAndAccess,
  // openOutputConnectionByPortIdAndAccess,
  // openPortConnectionByPortIdAndAccess,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPortIdAndAccess.ts'
export {
  openInputConnectionByPortIdInContext as openConnectionById,
  // openOutputConnectionByPortIdInContext,
  // openPortConnectionByPortIdInContext,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPortIdInContext.ts'
export {
  // type DualMakeStateChangesStream,
  // type MakeStateChangesStreamPortFirst,
  // type MakeStateChangesStreamPortLast,
  makeInputStateChangesStreamByPort as makeStateChangesStream,
  // makeOutputStateChangesStreamByPort,
  // makePortStateChangesStreamByPort,
  // type StateChangesStream,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPort.ts'
export {
  makeInputStateChangesStreamByPortIdAndAccess as makeStateChangesStreamByIdAndAccess,
  // makeOutputStateChangesStreamByPortIdAndAccess,
  // makePortStateChangesStreamByPortIdAndAccess,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPortIdAndAccess.ts'
export {
  makeInputStateChangesStreamByPortIdInContext as makeStateChangesStreamById,
  // makeOutputStateChangesStreamByPortIdInContext,
  // makePortStateChangesStreamByPortIdInContext,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPortIdInContext.ts'
export {
  isInputConnectionClosedByPort as isConnectionClosed,
  isInputConnectionOpenByPort as isConnectionOpen,
  isInputConnectionPendingByPort as isConnectionPending,
  isInputDeviceConnectedByPort as isDeviceConnected,
  isInputDeviceDisconnectedByPort as isDeviceDisconnected,
  // isOutputConnectionClosedByPort,
  // isOutputConnectionOpenByPort,
  // isOutputConnectionPendingByPort,
  // isOutputDeviceConnectedByPort,
  // isOutputDeviceDisconnectedByPort,
  // isPortConnectionClosedByPort,
  // isPortConnectionOpenByPort,
  // isPortConnectionPendingByPort,
  // isPortDeviceConnectedByPort,
  // isPortDeviceDisconnectedByPort,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPort.ts'
export {
  isInputConnectionClosedByPortIdAndAccess as isConnectionClosedByIdAndAccess,
  isInputConnectionOpenByPortIdAndAccess as isConnectionOpenByIdAndAccess,
  isInputConnectionPendingByPortIdAndAccess as isConnectionPendingByIdAndAccess,
  isInputDeviceConnectedByPortIdAndAccess as isDeviceConnectedByIdAndAccess,
  isInputDeviceDisconnectedByPortIdAndAccess as isDeviceDisconnectedByIdAndAccess,
  // isOutputConnectionClosedByPortIdAndAccess,
  // isOutputConnectionOpenByPortIdAndAccess,
  // isOutputConnectionPendingByPortIdAndAccess,
  // isOutputDeviceConnectedByPortIdAndAccess,
  // isOutputDeviceDisconnectedByPortIdAndAccess,
  // isPortConnectionClosedByPortIdAndAccess,
  // isPortConnectionOpenByPortIdAndAccess,
  // isPortConnectionPendingByPortIdAndAccess,
  // isPortDeviceConnectedByPortIdAndAccess,
  // isPortDeviceDisconnectedByPortIdAndAccess,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPortIdAndAccess.ts'
export {
  isInputConnectionClosedByPortIdInContext as isConnectionClosedById,
  isInputConnectionOpenByPortIdInContext as isConnectionOpenById,
  isInputConnectionPendingByPortIdInContext as isConnectionPendingById,
  isInputDeviceConnectedByPortIdInContext as isDeviceConnectedById,
  isInputDeviceDisconnectedByPortIdInContext as isDeviceDisconnectedById,
  // isOutputConnectionClosedByPortIdInContext,
  // isOutputConnectionOpenByPortIdInContext,
  // isOutputConnectionPendingByPortIdInContext,
  // isOutputDeviceConnectedByPortIdInContext,
  // isOutputDeviceDisconnectedByPortIdInContext,
  // isPortConnectionClosedByPortIdInContext,
  // isPortConnectionOpenByPortIdInContext,
  // isPortConnectionPendingByPortIdInContext,
  // isPortDeviceConnectedByPortIdInContext,
  // isPortDeviceDisconnectedByPortIdInContext,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPortIdInContext.ts'
export {
  getInputConnectionStateByPort as getConnectionState,
  getInputDeviceStateByPort as getDeviceState,
  // getOutputConnectionStateByPort,
  // getOutputDeviceStateByPort,
  // getPortConnectionStateByPort,
  // getPortDeviceStateByPort,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPort.ts'
export {
  getInputConnectionStateByPortIdAndAccess as getConnectionStateByIdAndAccess,
  getInputDeviceStateByPortIdAndAccess as getDeviceStateByIdAndAccess,
  // getOutputConnectionStateByPortIdAndAccess,
  // getOutputDeviceStateByPortIdAndAccess,
  // getPortConnectionStateByPortIdAndAccess,
  // getPortDeviceStateByPortIdAndAccess,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPortIdAndAccess.ts'
export {
  getInputConnectionStateByPortId as getConnectionStateById,
  getInputDeviceStateByPortId as getDeviceStateById,
  // getOutputConnectionStateByPortId,
  // getOutputDeviceStateByPortId,
  // getPortConnectionStateByPortId,
  // getPortDeviceStateByPortId,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPortIdInContext.ts'
export {
  // type DualMatchPortState,
  // type MatcherConfigPlain,
  // type MatchResult,
  // type MatchStatePortFirst,
  // type MatchStatePortLast,
  // type MIDIPortMutableProperty,
  matchInputConnectionStateByPort as matchConnectionState,
  matchInputDeviceStateByPort as matchDeviceState,
  // matchOutputConnectionStateByPort,
  // matchOutputDeviceStateByPort,
  // matchPortConnectionStateByPort,
  // matchPortDeviceStateByPort,
  // type PortStateHandler,
  // type StateCaseToHandlerMap,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPort.ts'
export {
  matchInputConnectionStateByPortIdAndAccess as matchConnectionStateByIdAndAccess,
  matchInputDeviceStateByPortIdAndAccess as matchDeviceStateByIdAndAccess,
  // matchOutputConnectionStateByPortIdAndAccess,
  // matchOutputDeviceStateByPortIdAndAccess,
  // matchPortConnectionStateByPortIdAndAccess,
  // matchPortDeviceStateByPortIdAndAccess,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPortIdAndAccess.ts'
export {
  matchInputConnectionStateByPortIdInContext as matchConnectionStateById,
  matchInputDeviceStateByPortIdInContext as matchDeviceStateById,
  // matchOutputConnectionStateByPortIdInContext,
  // matchOutputDeviceStateByPortIdInContext,
  // matchPortConnectionStateByPortIdInContext,
  // matchPortDeviceStateByPortIdInContext,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPortIdInContext.ts'
