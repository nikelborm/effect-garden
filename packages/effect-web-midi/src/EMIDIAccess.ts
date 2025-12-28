export {
  type BuiltStream,
  createStreamMakerFrom,
  type DualStreamMaker,
  type MakeStreamTargetFirst,
  type MakeStreamTargetLast,
  type OnNullStrategy,
  type StreamError,
  type StreamMakerOptions,
  type StreamMakerOptionsObject,
  type StreamMakerOptionsWellknown,
  type StreamValue,
} from './internal/createStreamMakerFrom.ts'
export {
  type AcquiredThing,
  AllPortsRecord,
  assert,
  // assumeImpl,
  clearPortById,
  type DualSendMIDIMessageFromAccess,
  EMIDIAccess,
  type EMIDIAccessInstance,
  type GetThingByPortId,
  type GetThingByPortIdAccessFirst,
  type GetThingByPortIdAccessLast,
  type GetThingByPortIdAccessLastSecondHalf,
  getAllPortsRecord,
  getInputsRecord,
  getOutputsRecord,
  InputsRecord,
  is,
  layer,
  layerMostRestricted,
  layerSoftwareSynthSupported,
  layerSystemExclusiveAndSoftwareSynthSupported,
  layerSystemExclusiveSupported,
  makeAllPortsStateChangesStream,
  makeAllPortsStateChangesStreamInContext,
  makeMessagesStreamByInputId,
  makeMessagesStreamByInputIdAndAccess,
  OutputsRecord,
  type PolymorphicAccessInstance,
  type PolymorphicAccessInstanceClean,
  type RequestMIDIAccessOptions,
  request,
  // resolve,
  type SendFromAccessArgs,
  type SendMIDIMessageAccessFirst,
  type SendMIDIMessageAccessLast,
  type SentMessageEffectFromAccess,
  send,
  sendInContext,
  sendToPortById,
  type TargetPortSelector,
  type TypeId,
} from './internal/EMIDIAccess.ts'
export {
  // assert,
  type EMIDIInput,
  // is,
  // make,
  makeMessagesStreamByPort,
  // type PolymorphicInput,
  // type PolymorphicInputClean,
} from './internal/EMIDIInput.ts'
export {
  // assert,
  clear,
  type DualSendMIDIMessageFromPort,
  type EMIDIOutput,
  // is,
  make,
  // type PolymorphicOutput,
  // type PolymorphicOutputClean,
  type SendFromPortArgs,
  type SendMIDIMessagePortFirst,
  type SendMIDIMessagePortLast,
  type SentMessageEffectFromPort,
  // send,
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
  type GetPortById,
  getInputByPortIdAndAccess as getInputByIdInPipe,
  getOutputByPortIdAndAccess as getOutputByIdInPipe,
  getPortByPortIdAndAccess as getPortByIdInPipe,
} from './internal/getPortByPortId/getPortByPortIdAndAccess.ts'
export {
  getInputByPortIdInContext as getInputById,
  getOutputByPortIdInContext as getOutputById,
  getPortByPortIdInContext as getPortById,
} from './internal/getPortByPortId/getPortByPortIdInContext.ts'
export {
  acquireReleaseInputConnectionByPort,
  acquireReleaseOutputConnectionByPort,
  acquireReleasePortConnectionByPort,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPort.ts'
export {
  acquireReleaseInputConnectionByPortIdAndAccess as acquireReleaseInputConnectionByIdInPipe,
  acquireReleaseOutputConnectionByPortIdAndAccess as acquireReleaseOutputConnectionByIdInPipe,
  acquireReleasePortConnectionByPortIdAndAccess as acquireReleasePortConnectionByIdInPipe,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPortIdAndAccess.ts'
export {
  acquireReleaseInputConnectionByPortIdInContext as acquireReleaseInputConnectionById,
  acquireReleaseOutputConnectionByPortIdInContext as acquireReleaseOutputConnectionById,
  acquireReleasePortConnectionByPortIdInContext as acquireReleasePortConnectionById,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPortIdInContext.ts'
export { actOnPort } from './internal/MIDIPortMethodCalls/actOnPort.ts'
export {
  closeInputConnectionByPort,
  closeOutputConnectionByPort,
  closePortConnectionByPort,
  makePortConnectionCloser,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPort.ts'
export {
  closeInputConnectionByPortIdAndAccess as closeInputConnectionByIdInPipe,
  closeOutputConnectionByPortIdAndAccess as closeOutputConnectionByIdInPipe,
  closePortConnectionByPortIdAndAccess as closePortConnectionByIdInPipe,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPortIdAndAccess.ts'
export {
  closeInputConnectionByPortIdInContext as closeInputConnectionById,
  closeOutputConnectionByPortIdInContext as closeOutputConnectionById,
  closePortConnectionByPortIdInContext as closePortConnectionById,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPortIdInContext.ts'
export {
  makeMIDIPortMethodCallerFactory,
  type TouchPort,
} from './internal/MIDIPortMethodCalls/makeMIDIPortMethodCallerFactory.ts'
export {
  makePortConnectionOpener,
  openInputConnectionByPort,
  openOutputConnectionByPort,
  openPortConnectionByPort,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPort.ts'
export {
  openInputConnectionByPortIdAndAccess as openInputConnectionByIdInPipe,
  openOutputConnectionByPortIdAndAccess as openOutputConnectionByIdInPipe,
  openPortConnectionByPortIdAndAccess as openPortConnectionByIdInPipe,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPortIdAndAccess.ts'
export {
  openInputConnectionByPortIdInContext as openInputConnectionById,
  openOutputConnectionByPortIdInContext as openOutputConnectionById,
  openPortConnectionByPortIdInContext as openPortConnectionById,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPortIdInContext.ts'
export {
  type DualMakeStateChangesStream,
  type MakeStateChangesStreamPortFirst,
  type MakeStateChangesStreamPortLast,
  makeInputStateChangesStreamByPort,
  makeOutputStateChangesStreamByPort,
  makePortStateChangesStreamByPort,
  type StateChangesStream,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPort.ts'
export {
  makeInputStateChangesStreamByPortIdAndAccess as makeInputStateChangesStreamByIdInPipe,
  makeOutputStateChangesStreamByPortIdAndAccess as makeOutputStateChangesStreamByIdInPipe,
  makePortStateChangesStreamByPortIdAndAccess as makePortStateChangesStreamByIdInPipe,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPortIdAndAccess.ts'
export {
  makeInputStateChangesStreamByPortIdInContext as makeInputStateChangesStreamById,
  makeOutputStateChangesStreamByPortIdInContext as makeOutputStateChangesStreamById,
  makePortStateChangesStreamByPortIdInContext as makePortStateChangesStreamById,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPortIdInContext.ts'
export {
  isInputConnectionClosedByPort,
  isInputConnectionOpenByPort,
  isInputConnectionPendingByPort,
  isInputDeviceConnectedByPort,
  isInputDeviceDisconnectedByPort,
  isOutputConnectionClosedByPort,
  isOutputConnectionOpenByPort,
  isOutputConnectionPendingByPort,
  isOutputDeviceConnectedByPort,
  isOutputDeviceDisconnectedByPort,
  isPortConnectionClosedByPort,
  isPortConnectionOpenByPort,
  isPortConnectionPendingByPort,
  isPortDeviceConnectedByPort,
  isPortDeviceDisconnectedByPort,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPort.ts'
export {
  isInputConnectionClosedByPortIdAndAccess as isInputConnectionClosedByIdInPipe,
  isInputConnectionOpenByPortIdAndAccess as isInputConnectionOpenByIdInPipe,
  isInputConnectionPendingByPortIdAndAccess as isInputConnectionPendingByIdInPipe,
  isInputDeviceConnectedByPortIdAndAccess as isInputDeviceConnectedByIdInPipe,
  isInputDeviceDisconnectedByPortIdAndAccess as isInputDeviceDisconnectedByIdInPipe,
  isOutputConnectionClosedByPortIdAndAccess as isOutputConnectionClosedByIdInPipe,
  isOutputConnectionOpenByPortIdAndAccess as isOutputConnectionOpenByIdInPipe,
  isOutputConnectionPendingByPortIdAndAccess as isOutputConnectionPendingByIdInPipe,
  isOutputDeviceConnectedByPortIdAndAccess as isOutputDeviceConnectedByIdInPipe,
  isOutputDeviceDisconnectedByPortIdAndAccess as isOutputDeviceDisconnectedByIdInPipe,
  isPortConnectionClosedByPortIdAndAccess as isPortConnectionClosedByIdInPipe,
  isPortConnectionOpenByPortIdAndAccess as isPortConnectionOpenByIdInPipe,
  isPortConnectionPendingByPortIdAndAccess as isPortConnectionPendingByIdInPipe,
  isPortDeviceConnectedByPortIdAndAccess as isPortDeviceConnectedByIdInPipe,
  isPortDeviceDisconnectedByPortIdAndAccess as isPortDeviceDisconnectedByIdInPipe,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPortIdAndAccess.ts'
export {
  isInputConnectionClosedByPortIdInContext as isInputConnectionClosedById,
  isInputConnectionOpenByPortIdInContext as isInputConnectionOpenById,
  isInputConnectionPendingByPortIdInContext as isInputConnectionPendingById,
  isInputDeviceConnectedByPortIdInContext as isInputDeviceConnectedById,
  isInputDeviceDisconnectedByPortIdInContext as isInputDeviceDisconnectedById,
  isOutputConnectionClosedByPortIdInContext as isOutputConnectionClosedById,
  isOutputConnectionOpenByPortIdInContext as isOutputConnectionOpenById,
  isOutputConnectionPendingByPortIdInContext as isOutputConnectionPendingById,
  isOutputDeviceConnectedByPortIdInContext as isOutputDeviceConnectedById,
  isOutputDeviceDisconnectedByPortIdInContext as isOutputDeviceDisconnectedById,
  isPortConnectionClosedByPortIdInContext as isPortConnectionClosedById,
  isPortConnectionOpenByPortIdInContext as isPortConnectionOpenById,
  isPortConnectionPendingByPortIdInContext as isPortConnectionPendingById,
  isPortDeviceConnectedByPortIdInContext as isPortDeviceConnectedById,
  isPortDeviceDisconnectedByPortIdInContext as isPortDeviceDisconnectedById,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPortIdInContext.ts'
export {
  getInputConnectionStateByPort,
  getInputDeviceStateByPort,
  getOutputConnectionStateByPort,
  getOutputDeviceStateByPort,
  getPortConnectionStateByPort,
  getPortDeviceStateByPort,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPort.ts'
export {
  getInputConnectionStateByPortIdAndAccess as getInputConnectionStateByIdInPipe,
  getInputDeviceStateByPortIdAndAccess as getInputDeviceStateByIdInPipe,
  getOutputConnectionStateByPortIdAndAccess as getOutputConnectionStateByIdInPipe,
  getOutputDeviceStateByPortIdAndAccess as getOutputDeviceStateByIdInPipe,
  getPortConnectionStateByPortIdAndAccess as getPortConnectionStateByIdInPipe,
  getPortDeviceStateByPortIdAndAccess as getPortDeviceStateByIdInPipe,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPortIdAndAccess.ts'
export {
  getInputConnectionStateByPortId as getInputConnectionStateById,
  getInputDeviceStateByPortId as getInputDeviceStateById,
  getOutputConnectionStateByPortId as getOutputConnectionStateById,
  getOutputDeviceStateByPortId as getOutputDeviceStateById,
  getPortConnectionStateByPortId as getPortConnectionStateById,
  getPortDeviceStateByPortId as getPortDeviceStateById,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPortIdInContext.ts'
export { getValueInRawPortFieldUnsafe } from './internal/mutablePropertyTools/getValueInRawPortFieldUnsafe.ts'
export {
  type DualMatchPortState,
  type MatcherConfigPlain,
  type MatchResult,
  type MatchStatePortFirst,
  type MatchStatePortLast,
  type MIDIPortMutableProperty,
  matchInputConnectionStateByPort,
  matchInputDeviceStateByPort,
  matchOutputConnectionStateByPort,
  matchOutputDeviceStateByPort,
  matchPortConnectionStateByPort,
  matchPortDeviceStateByPort,
  type PortStateHandler,
  type StateCaseToHandlerMap,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPort.ts'
export {
  matchInputConnectionStateByPortIdAndAccess as matchInputConnectionStateByIdInPipe,
  matchInputDeviceStateByPortIdAndAccess as matchInputDeviceStateByIdInPipe,
  matchOutputConnectionStateByPortIdAndAccess as matchOutputConnectionStateByIdInPipe,
  matchOutputDeviceStateByPortIdAndAccess as matchOutputDeviceStateByIdInPipe,
  matchPortConnectionStateByPortIdAndAccess as matchPortConnectionStateBydInPipe,
  matchPortDeviceStateByPortIdAndAccess as matchPortDeviceStateByIdInPipe,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPortIdAndAccess.ts'
export {
  matchInputConnectionStateByPortIdInContext as matchInputConnectionStateById,
  matchInputDeviceStateByPortIdInContext as matchInputDeviceStateById,
  matchOutputConnectionStateByPortIdInContext as matchOutputConnectionStateById,
  matchOutputDeviceStateByPortIdInContext as matchOutputDeviceStateById,
  matchPortConnectionStateByPortIdInContext as matchPortConnectionStateById,
  matchPortDeviceStateByPortIdInContext as matchPortDeviceStateByPortId,
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
  type FallbackOnUnknownOrAny,
  fromPolymorphic,
  getStaticMIDIPortInfo,
  type IsEqualFlag,
  isCertainConnectionState,
  isCertainDeviceState,
  isConnectionClosed,
  isConnectionOpen,
  isConnectionPending,
  isDeviceConnected,
  isDeviceDisconnected,
  MIDIBothPortId,
  MIDIInputId,
  MIDIOutputId,
  type MIDIPortId,
  type MIDIPortStaticFields,
  midiPortStaticFields,
  type PolymorphicEffect,
  polymorphicCheckInDual,
  type SentMessageEffectFrom,
} from './internal/util.ts'
