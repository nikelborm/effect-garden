export {
  acquireReleaseInputConnectionByPort,
  acquireReleaseOutputConnectionByPort,
  acquireReleasePortConnectionByPort,
  makeConnectionAcquirerReleaser,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPort.ts'
export {
  acquireReleaseInputConnectionByPortIdAndAccess,
  acquireReleaseOutputConnectionByPortIdAndAccess,
  acquireReleasePortConnectionByPortIdAndAccess,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPortIdAndAccess.ts'
export {
  acquireReleaseInputConnectionByPortIdInContext,
  acquireReleaseOutputConnectionByPortIdInContext,
  acquireReleasePortConnectionByPortIdInContext,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPortIdInContext.ts'
export {
  closeInputConnectionByPort,
  closeOutputConnectionByPort,
  closePortConnectionByPort,
  makePortConnectionCloser,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPort.ts'
export {
  closeInputConnectionByPortIdAndAccess,
  closeOutputConnectionByPortIdAndAccess,
  closePortConnectionByPortIdAndAccess,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPortIdAndAccess.ts'
export {
  closeInputConnectionByPortIdInContext,
  closeOutputConnectionByPortIdInContext,
  closePortConnectionByPortIdInContext,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPortIdInContext.ts'
export {
  makePortConnectionOpener,
  openInputConnectionByPort,
  openOutputConnectionByPort,
  openPortConnectionByPort,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPort.ts'
export {
  openInputConnectionByPortIdAndAccess,
  openOutputConnectionByPortIdAndAccess,
  openPortConnectionByPortIdAndAccess,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPortIdAndAccess.ts'
export {
  openInputConnectionByPortIdInContext,
  openOutputConnectionByPortIdInContext,
  openPortConnectionByPortIdInContext,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPortIdInContext.ts'
export {
  getInputByPortIdInContext,
  getOutputByPortIdInContext,
  getPortByPortIdInContext,
} from './internal/getPortByPortId/getPortByPortIdInContext.ts'
export {
  type AcquiredThing,
  type GetPortById,
  type GetThingByPortId,
  type GetThingByPortIdAccessFirst,
  type GetThingByPortIdAccessLast,
  type GetThingByPortIdAccessLastSecondHalf,
  getInputByPortIdAndAccess,
  getOutputByPortIdAndAccess,
  getPortByIdAndRemap,
  getPortByPortIdAndAccess,
} from './internal/getPortByPortId/getPortByPortIdAndAccess.ts'
export {
  type DualMakeStateChangesStream,
  type MakeStateChangesStreamPortFirst,
  type MakeStateChangesStreamPortLast,
  type StateChangesStream,
  makeInputStateChangesStreamByPort,
  makeOutputStateChangesStreamByPort,
  makePortStateChangesStreamByPort,
  makePortStateChangesStreamFactory,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPort.ts'
export {} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPortIdAndAccess.ts'
export {
  makeInputStateChangesStreamByPortIdInContext,
  makeOutputStateChangesStreamByPortIdInContext,
  makePortStateChangesStreamByPortIdInContext,
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
  getInputConnectionStateByPort,
  getInputDeviceStateByPort,
  getOutputConnectionStateByPort,
  getOutputDeviceStateByPort,
  getPortConnectionStateByPort,
  getPortDeviceStateByPort,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPort.ts'
export {
  getPortConnectionStateByPortIdAndAccess,
  getPortDeviceStateByPortIdAndAccess,
} from './internal/mutablePropertyTools/getMutablePortProperty/getMutablePortPropertyByPortIdAndAccess.ts'
export {
  getPortConnectionStateByPortId,
  getPortDeviceStateByPortId,
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
  matchInputConnectionStateByPort,
  matchInputDeviceStateByPort,
  matchOutputConnectionStateByPort,
  matchOutputDeviceStateByPort,
  matchPortConnectionStateByPort,
  matchPortDeviceStateByPort,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPort.ts'
export {} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPortIdAndAccess.ts'
export {
  matchInputConnectionStateByPortIdInContext as matchInputConnectionStateByPortId,
  matchInputDeviceStateByPortIdInContext as matchInputDeviceStateByPortId,
  matchOutputConnectionStateByPortIdInContext as matchOutputConnectionStateByPortId,
  matchOutputDeviceStateByPortIdInContext as matchOutputDeviceStateByPortId,
  matchPortConnectionStateByPortIdInContext as matchPortConnectionStateByPortId,
  matchPortDeviceStateByPortIdInContext as matchPortDeviceStateByPortId,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPortIdInContext.ts'

export {} from './internal/EMIDIAccess.ts'
export {} from './internal/EMIDIInput.ts'
export {} from './internal/EMIDIOutput.ts'
export {} from './internal/EMIDIPort.ts'
// export {
//   makeInputStateChangesStreamByPortId as makeStateChangesStreamById,
//   makeMessagesStreamByPortId as makeMessagesStreamById,
//   matchInputConnectionStateByPortId as matchConnectionStateById,
//   matchInputDeviceStateByPortId as matchDeviceStateById,
// } from './internal/contextualFunctions.ts'

export {
  assert,
  type EMIDIInput,
  is,
  makeMessagesStream,
  makeStateChangesStream,
  matchConnectionState,
  matchDeviceState,
} from './internal/EMIDIInput.ts'
