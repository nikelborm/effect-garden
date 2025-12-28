// export {
//   type BuiltStream,
//   createStreamMakerFrom,
//   type DualStreamMaker,
//   type MakeStreamTargetFirst,
//   type MakeStreamTargetLast,
//   type OnNullStrategy,
//   type StreamError,
//   type StreamMakerOptions,
//   type StreamMakerOptionsObject,
//   type StreamMakerOptionsWellknown,
//   type StreamValue,
// } from './internal/createStreamMakerFrom.ts'
export {
  // type AcquiredThing,
  // AllPortsRecord,
  // assert,
  // assumeImpl,
  clearPortById,
  type DualSendMIDIMessageFromAccess,
  // EMIDIAccess,
  // type EMIDIAccessInstance,
  // type GetThingByPortId,
  // type GetThingByPortIdAccessFirst,
  // type GetThingByPortIdAccessLast,
  // type GetThingByPortIdAccessLastSecondHalf,
  // getAllPortsRecord,
  // getInputsRecord,
  getOutputsRecord as getRecord,
  // InputsRecord,
  // is,
  // layer,
  // layerMostRestricted,
  // layerSoftwareSynthSupported,
  // layerSystemExclusiveAndSoftwareSynthSupported,
  // layerSystemExclusiveSupported,
  // makeAllPortsStateChangesStream,
  // makeAllPortsStateChangesStreamInContext,
  // makeMessagesStreamByInputId,
  OutputsRecord as Record,
  // type PolymorphicAccessInstance,
  // type PolymorphicAccessInstanceClean,
  // type RequestMIDIAccessOptions,
  // request,
  // resolve,
  type SendFromAccessArgs,
  type SendMIDIMessageAccessFirst,
  type SendMIDIMessageAccessLast,
  type SentMessageEffectFromAccess,
  // send,
  sendInContext,
  sendToPortById,
  type TargetPortSelector,
  // type TypeId,
} from './internal/EMIDIAccess.ts'
// export {
//   assert,
//   type EMIDIInput,
//   is,
//   make,
//   makeMessagesStream,
//   type PolymorphicInput,
//   type PolymorphicInputClean,
// } from './internal/EMIDIInput.ts'
export {
  assert,
  clear,
  type DualSendMIDIMessageFromPort,
  type EMIDIOutput,
  is,
  // make,
  type PolymorphicOutput,
  type PolymorphicOutputClean,
  type SendFromPortArgs,
  type SendMIDIMessagePortFirst,
  type SendMIDIMessagePortLast,
  type SentMessageEffectFromPort,
  send,
} from './internal/EMIDIOutput.ts'
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
  // getInputByPortIdAndAccess,
  getOutputByPortIdAndAccess as getByIdAndAccess,
  // getPortByPortIdAndAccess,
} from './internal/getPortByPortId/getPortByPortIdAndAccess.ts'
export {
  // getInputByPortIdInContext,
  getOutputByPortIdInContext as getById,
  // getPortByPortIdInContext,
} from './internal/getPortByPortId/getPortByPortIdInContext.ts'
export {
  // acquireReleaseInputConnectionByPort,
  acquireReleaseOutputConnectionByPort as acquireReleaseConnection,
  // acquireReleasePortConnectionByPort,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPort.ts'
export {
  // acquireReleaseInputConnectionByPortIdAndAccess,
  acquireReleaseOutputConnectionByPortIdAndAccess as acquireReleaseConnectionByIdAndAccess,
  // acquireReleasePortConnectionByPortIdAndAccess,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPortIdAndAccess.ts'
export {
  // acquireReleaseInputConnectionByPortIdInContext,
  acquireReleaseOutputConnectionByPortIdInContext as acquireReleaseConnectionById,
  // acquireReleasePortConnectionByPortIdInContext,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPortIdInContext.ts'
// export { actOnPort } from './internal/MIDIPortMethodCalls/actOnPort.ts'
export {
  // closeInputConnectionByPort,
  closeOutputConnectionByPort as closeConnection,
  // closePortConnectionByPort,
  // makePortConnectionCloser,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPort.ts'
export {
  // closeInputConnectionByPortIdAndAccess,
  closeOutputConnectionByPortIdAndAccess as closeConnectionByIdAndAccess,
  // closePortConnectionByPortIdAndAccess,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPortIdAndAccess.ts'
export {
  // closeInputConnectionByPortIdInContext,
  closeOutputConnectionByPortIdInContext as closeConnectionById,
  // closePortConnectionByPortIdInContext,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPortIdInContext.ts'
// export {
//   makeMIDIPortMethodCallerFactory,
//   type TouchPort,
// } from './internal/MIDIPortMethodCalls/makeMIDIPortMethodCallerFactory.ts'
export {
  // makePortConnectionOpener,
  // openInputConnectionByPort,
  openOutputConnectionByPort as openConnection,
  // openPortConnectionByPort,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPort.ts'
export {
  // openInputConnectionByPortIdAndAccess,
  openOutputConnectionByPortIdAndAccess as openConnectionByIdAndAccess,
  // openPortConnectionByPortIdAndAccess,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPortIdAndAccess.ts'
export {
  // openInputConnectionByPortIdInContext,
  openOutputConnectionByPortIdInContext as openConnectionById,
  // openPortConnectionByPortIdInContext,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPortIdInContext.ts'
export {
  // type DualMakeStateChangesStream,
  // type MakeStateChangesStreamPortFirst,
  // type MakeStateChangesStreamPortLast,
  // makeInputStateChangesStreamByPort,
  makeOutputStateChangesStreamByPort as makeStateChangesStream,
  // makePortStateChangesStreamByPort,
  // type StateChangesStream,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPort.ts'
export {
  // makeInputStateChangesStreamByPortIdAndAccess,
  makeOutputStateChangesStreamByPortIdAndAccess as makeStateChangesStreamByIdAndAccess,
  // makePortStateChangesStreamByPortIdAndAccess,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPortIdAndAccess.ts'
export {
  // makeInputStateChangesStreamByPortIdInContext,
  makeOutputStateChangesStreamByPortIdInContext as makeStateChangesStreamById,
  // makePortStateChangesStreamByPortIdInContext,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPortIdInContext.ts'
export {
  // isInputConnectionClosedByPort,
  // isInputConnectionOpenByPort,
  // isInputConnectionPendingByPort,
  // isInputDeviceConnectedByPort,
  // isInputDeviceDisconnectedByPort,
  isOutputConnectionClosedByPort as isConnectionClosed,
  isOutputConnectionOpenByPort as isConnectionOpen,
  isOutputConnectionPendingByPort as isConnectionPending,
  isOutputDeviceConnectedByPort as isDeviceConnected,
  isOutputDeviceDisconnectedByPort as isDeviceDisconnected,
  // isPortConnectionClosedByPort,
  // isPortConnectionOpenByPort,
  // isPortConnectionPendingByPort,
  // isPortDeviceConnectedByPort,
  // isPortDeviceDisconnectedByPort,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPort.ts'
export {
  // isInputConnectionClosedByPortIdAndAccess,
  // isInputConnectionOpenByPortIdAndAccess,
  // isInputConnectionPendingByPortIdAndAccess,
  // isInputDeviceConnectedByPortIdAndAccess,
  // isInputDeviceDisconnectedByPortIdAndAccess,
  isOutputConnectionClosedByPortIdAndAccess as isConnectionClosedByIdAndAccess,
  isOutputConnectionOpenByPortIdAndAccess as isConnectionOpenByIdAndAccess,
  isOutputConnectionPendingByPortIdAndAccess as isConnectionPendingByIdAndAccess,
  isOutputDeviceConnectedByPortIdAndAccess as isDeviceConnectedByIdAndAccess,
  isOutputDeviceDisconnectedByPortIdAndAccess as isDeviceDisconnectedByIdAndAccess,
  // isPortConnectionClosedByPortIdAndAccess,
  // isPortConnectionOpenByPortIdAndAccess,
  // isPortConnectionPendingByPortIdAndAccess,
  // isPortDeviceConnectedByPortIdAndAccess,
  // isPortDeviceDisconnectedByPortIdAndAccess,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPortIdAndAccess.ts'
export {
  // isInputConnectionClosedByPortIdInContext,
  // isInputConnectionOpenByPortIdInContext,
  // isInputConnectionPendingByPortIdInContext,
  // isInputDeviceConnectedByPortIdInContext,
  // isInputDeviceDisconnectedByPortIdInContext,
  isOutputConnectionClosedByPortIdInContext as isConnectionClosedById,
  isOutputConnectionOpenByPortIdInContext as isConnectionOpenById,
  isOutputConnectionPendingByPortIdInContext as isConnectionPendingById,
  isOutputDeviceConnectedByPortIdInContext as isDeviceConnectedById,
  isOutputDeviceDisconnectedByPortIdInContext as isDeviceDisconnectedById,
  // isPortConnectionClosedByPortIdInContext,
  // isPortConnectionOpenByPortIdInContext,
  // isPortConnectionPendingByPortIdInContext,
  // isPortDeviceConnectedByPortIdInContext,
  // isPortDeviceDisconnectedByPortIdInContext,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPortIdInContext.ts'
export {
  // getInputConnectionStateByPort,
  // getInputDeviceStateByPort,
  getOutputConnectionStateByPort as getConnectionState,
  getOutputDeviceStateByPort as getDeviceState,
  // getPortConnectionStateByPort,
  // getPortDeviceStateByPort,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPort.ts'
export {
  // getInputConnectionStateByPortIdAndAccess,
  // getInputDeviceStateByPortIdAndAccess,
  getOutputConnectionStateByPortIdAndAccess as getConnectionStateByIdAndAccess,
  getOutputDeviceStateByPortIdAndAccess as getDeviceStateByIdAndAccess,
  // getPortConnectionStateByPortIdAndAccess,
  // getPortDeviceStateByPortIdAndAccess,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPortIdAndAccess.ts'
export {
  // getInputConnectionStateByPortId,
  // getInputDeviceStateByPortId,
  getOutputConnectionStateByPortId as getConnectionStateById,
  getOutputDeviceStateByPortId as getDeviceStateById,
  // getPortConnectionStateByPortId,
  // getPortDeviceStateByPortId,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPortIdInContext.ts'
// export { getValueInRawPortFieldUnsafe } from './internal/mutablePropertyTools/getValueInRawPortFieldUnsafe.ts'
export {
  // type DualMatchPortState,
  // type MatcherConfigPlain,
  // type MatchResult,
  // type MatchStatePortFirst,
  // type MatchStatePortLast,
  // type MIDIPortMutableProperty,
  // matchInputConnectionStateByPort,
  // matchInputDeviceStateByPort,
  matchOutputConnectionStateByPort as matchConnectionState,
  matchOutputDeviceStateByPort as matchDeviceState,
  // matchPortConnectionStateByPort,
  // matchPortDeviceStateByPort,
  // type PortStateHandler,
  // type StateCaseToHandlerMap,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPort.ts'
export {
  // matchInputConnectionStateByPortIdAndAccess,
  // matchInputDeviceStateByPortIdAndAccess,
  matchOutputConnectionStateByPortIdAndAccess as matchConnectionStateByIdAndAccess,
  matchOutputDeviceStateByPortIdAndAccess as matchDeviceStateByIdAndAccess,
  // matchPortConnectionStateByPortIdAndAccess,
  // matchPortDeviceStateByPortIdAndAccess,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPortIdAndAccess.ts'
export {
  // matchInputConnectionStateByPortIdInContext,
  // matchInputDeviceStateByPortIdInContext,
  matchOutputConnectionStateByPortIdInContext as matchConnectionStateById,
  matchOutputDeviceStateByPortIdInContext as matchDeviceStateById,
  // matchPortConnectionStateByPortIdInContext,
  // matchPortDeviceStateByPortIdInContext,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPortIdInContext.ts'
// export {
//   type ControlChange,
//   type NotePress,
//   type NoteRelease,
//   type ParsedMIDIMessages,
//   type PitchBendChange,
//   type TouchpadPositionUpdate,
//   type TouchpadRelease,
//   type UnknownReply,
//   withParsedDataField,
//   withTouchpadPositionUpdates,
// } from './internal/parsing.ts'
// export { mapToGlidingStringLogOfLimitedEntriesCount } from './internal/rendering.ts'
export {
  // type FallbackOnUnknownOrAny,
  // fromPolymorphic,
  // getStaticMIDIPortInfo,
  // type IsEqualFlag,
  // isCertainConnectionState,
  // isCertainDeviceState,
  // isConnectionClosed,
  // isConnectionOpen,
  // isConnectionPending,
  // isDeviceConnected,
  // isDeviceDisconnected,
  // MIDIBothPortId,
  // MIDIInputId,
  MIDIOutputId as Id,
  // type MIDIPortId,
  // type MIDIPortStaticFields,
  // midiPortStaticFields,
  // type PolymorphicEffect,
  // polymorphicCheckInDual,
  // type SentMessageEffectFrom,
} from './internal/util.ts'
