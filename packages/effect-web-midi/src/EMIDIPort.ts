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
  AllPortsRecord as FullRecord,
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
  getAllPortsRecord as getFullRecord,
  // getInputsRecord,
  // getOutputsRecord,
  // InputsRecord,
  // is,
  // layer,
  // layerMostRestricted,
  // layerSoftwareSynthSupported,
  // layerSystemExclusiveAndSoftwareSynthSupported,
  // layerSystemExclusiveSupported,
  makeAllPortsStateChangesStream,
  makeAllPortsStateChangesStreamInContext,
  // makeMessagesStreamByInputId,
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
// export {
//   assert,
//   type EMIDIInput,
//   is,
//   make,
//   makeMessagesStream,
// } from './internal/EMIDIInput.ts'
// export {
//   assert,
//   clear,
//   type DualSendMIDIMessageFromPort,
//   type EMIDIOutput,
//   is,
//   make,
//   type PolymorphicOutput,
//   type SendFromPortArgs,
//   type SendMIDIMessagePortFirst,
//   type SendMIDIMessagePortLast,
//   type SentMessageEffectFromPort,
//   send,
// } from './internal/EMIDIOutput.ts'
export {
  assert,
  BothId,
  // assumeImpl,
  type EMIDIPort,
  // type EMIDIPortImpl,
  type ExtractTypeFromPort,
  type Id,
  is,
  // isImplOfSpecificType,
  // makeImpl,
  type PolymorphicPort,
  type PolymorphicPortClean,
  type TypeId,
} from './internal/EMIDIPort.ts'
export {
  // type GetPortById,
  // getInputByPortIdAndAccess,
  // getOutputByPortIdAndAccess,
  getPortByPortIdAndAccess as getByIdAndAccess,
} from './internal/getPortByPortId/getPortByPortIdAndAccess.ts'
export {
  // getInputByPortIdInContext,
  // getOutputByPortIdInContext,
  getPortByPortIdInContext as getById,
} from './internal/getPortByPortId/getPortByPortIdInContext.ts'
export {
  // acquireReleaseInputConnectionByPort,
  // acquireReleaseOutputConnectionByPort,
  acquireReleasePortConnectionByPort as acquireReleaseConnection,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPort.ts'
export {
  // acquireReleaseInputConnectionByPortIdAndAccess,
  // acquireReleaseOutputConnectionByPortIdAndAccess,
  acquireReleasePortConnectionByPortIdAndAccess as acquireReleaseConnectionByIdAndAccess,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPortIdAndAccess.ts'
export {
  // acquireReleaseInputConnectionByPortIdInContext,
  // acquireReleaseOutputConnectionByPortIdInContext,
  acquireReleasePortConnectionByPortIdInContext as acquireReleaseConnectionById,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPortIdInContext.ts'
// export { actOnPort } from './internal/MIDIPortMethodCalls/actOnPort.ts'
export {
  // closeInputConnectionByPort,
  // closeOutputConnectionByPort,
  closePortConnectionByPort as closeConnection,
  // makePortConnectionCloser,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPort.ts'
export {
  // closeInputConnectionByPortIdAndAccess,
  // closeOutputConnectionByPortIdAndAccess,
  closePortConnectionByPortIdAndAccess as closeConnectionByIdAndAccess,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPortIdAndAccess.ts'
export {
  // closeInputConnectionByPortIdInContext,
  // closeOutputConnectionByPortIdInContext,
  closePortConnectionByPortIdInContext as closeConnectionById,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPortIdInContext.ts'
// export {
//   makeMIDIPortMethodCallerFactory,
//   type TouchPort,
// } from './internal/MIDIPortMethodCalls/makeMIDIPortMethodCallerFactory.ts'
export {
  // makePortConnectionOpener,
  // openInputConnectionByPort,
  // openOutputConnectionByPort,
  openPortConnectionByPort as openConnection,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPort.ts'
export {
  // openInputConnectionByPortIdAndAccess,
  // openOutputConnectionByPortIdAndAccess,
  openPortConnectionByPortIdAndAccess as openConnectionByIdAndAccess,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPortIdAndAccess.ts'
export {
  // openInputConnectionByPortIdInContext,
  // openOutputConnectionByPortIdInContext,
  openPortConnectionByPortIdInContext as openConnectionById,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPortIdInContext.ts'
export {
  // type DualMakeStateChangesStream,
  // type MakeStateChangesStreamPortFirst,
  // type MakeStateChangesStreamPortLast,
  // makeInputStateChangesStreamByPort,
  // makeOutputStateChangesStreamByPort,
  makePortStateChangesStreamByPort as makeStateChangesStream,
  type StateChangesStream,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPort.ts'
export {
  // makeInputStateChangesStreamByPortIdAndAccess,
  // makeOutputStateChangesStreamByPortIdAndAccess,
  makePortStateChangesStreamByPortIdAndAccess as makeStateChangesStreamByIdAndAccess,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPortIdAndAccess.ts'
export {
  // makeInputStateChangesStreamByPortIdInContext,
  // makeOutputStateChangesStreamByPortIdInContext,
  makePortStateChangesStreamByPortIdInContext as makeStateChangesStreamById,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPortIdInContext.ts'
export {
  // isInputConnectionClosedByPort,
  // isInputConnectionOpenByPort,
  // isInputConnectionPendingByPort,
  // isInputDeviceConnectedByPort,
  // isInputDeviceDisconnectedByPort,
  // isOutputConnectionClosedByPort,
  // isOutputConnectionOpenByPort,
  // isOutputConnectionPendingByPort,
  // isOutputDeviceConnectedByPort,
  // isOutputDeviceDisconnectedByPort,
  isPortConnectionClosedByPort as isConnectionClosed,
  isPortConnectionOpenByPort as isConnectionOpen,
  isPortConnectionPendingByPort as isConnectionPending,
  isPortDeviceConnectedByPort as isDeviceConnected,
  isPortDeviceDisconnectedByPort as isDeviceDisconnected,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPort.ts'
export {
  // isInputConnectionClosedByPortIdAndAccess,
  // isInputConnectionOpenByPortIdAndAccess,
  // isInputConnectionPendingByPortIdAndAccess,
  // isInputDeviceConnectedByPortIdAndAccess,
  // isInputDeviceDisconnectedByPortIdAndAccess,
  // isOutputConnectionClosedByPortIdAndAccess,
  // isOutputConnectionOpenByPortIdAndAccess,
  // isOutputConnectionPendingByPortIdAndAccess,
  // isOutputDeviceConnectedByPortIdAndAccess,
  // isOutputDeviceDisconnectedByPortIdAndAccess,
  isPortConnectionClosedByPortIdAndAccess as isConnectionClosedByIdAndAccess,
  isPortConnectionOpenByPortIdAndAccess as isConnectionOpenByIdAndAccess,
  isPortConnectionPendingByPortIdAndAccess as isConnectionPendingByIdAndAccess,
  isPortDeviceConnectedByPortIdAndAccess as isDeviceConnectedByIdAndAccess,
  isPortDeviceDisconnectedByPortIdAndAccess as isDeviceDisconnectedByIdAndAccess,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPortIdAndAccess.ts'
export {
  // isInputConnectionClosedByPortIdInContext,
  // isInputConnectionOpenByPortIdInContext,
  // isInputConnectionPendingByPortIdInContext,
  // isInputDeviceConnectedByPortIdInContext,
  // isInputDeviceDisconnectedByPortIdInContext,
  // isOutputConnectionClosedByPortIdInContext,
  // isOutputConnectionOpenByPortIdInContext,
  // isOutputConnectionPendingByPortIdInContext,
  // isOutputDeviceConnectedByPortIdInContext,
  // isOutputDeviceDisconnectedByPortIdInContext,
  isPortConnectionClosedByPortIdInContext as isConnectionClosedById,
  isPortConnectionOpenByPortIdInContext as isConnectionOpenById,
  isPortConnectionPendingByPortIdInContext as isConnectionPendingById,
  isPortDeviceConnectedByPortIdInContext as isDeviceConnectedById,
  isPortDeviceDisconnectedByPortIdInContext as isDeviceDisconnectedById,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPortIdInContext.ts'
export {
  // getInputConnectionStateByPort,
  // getInputDeviceStateByPort,
  // getOutputConnectionStateByPort,
  // getOutputDeviceStateByPort,
  getPortConnectionStateByPort as getConnectionState,
  getPortDeviceStateByPort as getDeviceState,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPort.ts'
export {
  // getInputConnectionStateByPortIdAndAccess,
  // getInputDeviceStateByPortIdAndAccess,
  // getOutputConnectionStateByPortIdAndAccess,
  // getOutputDeviceStateByPortIdAndAccess,
  getPortConnectionStateByPortIdAndAccess as getConnectionStateByIdAndAccess,
  getPortDeviceStateByPortIdAndAccess as getDeviceStateByIdAndAccess,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPortIdAndAccess.ts'
export {
  // getInputConnectionStateByPortId,
  // getInputDeviceStateByPortId,
  // getOutputConnectionStateByPortId,
  // getOutputDeviceStateByPortId,
  getPortConnectionStateByPortId as getConnectionStateById,
  getPortDeviceStateByPortId as getDeviceStateById,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPortIdInContext.ts'
export { getValueInRawPortFieldUnsafe } from './internal/mutablePropertyTools/getValueInRawPortFieldUnsafe.ts'
export {
  // type DualMatchPortState,
  // type MatcherConfigPlain,
  // type MatchResult,
  // type MatchStatePortFirst,
  // type MatchStatePortLast,
  // type MIDIPortMutableProperty,
  // matchInputConnectionStateByPort,
  // matchInputDeviceStateByPort,
  // matchOutputConnectionStateByPort,
  // matchOutputDeviceStateByPort,
  matchPortConnectionStateByPort as matchConnectionState,
  matchPortDeviceStateByPort as matchDeviceState,
  // type PortStateHandler,
  // type StateCaseToHandlerMap,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPort.ts'
export {
  // matchInputConnectionStateByPortIdAndAccess,
  // matchInputDeviceStateByPortIdAndAccess,
  // matchOutputConnectionStateByPortIdAndAccess,
  // matchOutputDeviceStateByPortIdAndAccess,
  matchPortConnectionStateByPortIdAndAccess as matchConnectionStateByIdAndAccess,
  matchPortDeviceStateByPortIdAndAccess as matchDeviceStateByIdAndAccess,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPortIdAndAccess.ts'
export {
  // matchInputConnectionStateByPortIdInContext,
  // matchInputDeviceStateByPortIdInContext,
  // matchOutputConnectionStateByPortIdInContext,
  // matchOutputDeviceStateByPortIdInContext,
  matchPortConnectionStateByPortIdInContext as matchConnectionStateById,
  matchPortDeviceStateByPortIdInContext as matchDeviceStateById,
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
// export {
//   type FallbackOnUnknownOrAny,
//   fromPolymorphic,
//   getStaticMIDIPortInfo,
//   type IsEqualFlag,
//   isCertainConnectionState,
//   isCertainDeviceState,
//   isConnectionClosed,
//   isConnectionOpen,
//   isConnectionPending,
//   isDeviceConnected,
//   isDeviceDisconnected,
//   type MIDIPortStaticFields,
//   midiPortStaticFields,
//   type PolymorphicEffect,
//   polymorphicCheckInDual,
//   type SentMessageEffectFrom,
// } from './internal/util.ts'
