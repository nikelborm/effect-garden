// remember to make sure there's no ___FromContext and ___ByPortId in
// internal/EMIDIPort.ts and put them into EMIDIAccess
export {
  acquireReleaseInputPortConnectionByPort,
  acquireReleaseOutputPortConnectionByPort,
  acquireReleasePortConnectionByPort,
  makeConnectionAcquirerReleaser,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPort.ts'
export {
  acquireReleaseInputPortConnectionByPortIdAndAccess,
  acquireReleaseOutputPortConnectionByPortIdAndAccess,
  acquireReleasePortConnectionByPortIdAndAccess,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPortIdAndAccess.ts'
export {
  acquireReleaseInputPortConnectionByPortIdInContext,
  acquireReleaseOutputPortConnectionByPortIdInContext,
  acquireReleasePortConnectionByPortIdInContext,
} from './internal/MIDIPortMethodCalls/acquireReleasePortConnection/acquireReleasePortConnectionByPortIdInContext.ts'
export {
  closeInputPortConnectionByPort,
  closeOutputPortConnectionByPort,
  closePortConnectionByPort,
  makePortConnectionCloser,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPort.ts'
export {
  closeInputPortConnectionByPortIdAndAccess,
  closeOutputPortConnectionByPortIdAndAccess,
  closePortConnectionByPortIdAndAccess,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPortIdAndAccess.ts'
export {
  closeInputPortConnectionByPortIdInContext,
  closeOutputPortConnectionByPortIdInContext,
  closePortConnectionByPortIdInContext,
} from './internal/MIDIPortMethodCalls/closePortConnection/closePortConnectionByPortIdInContext.ts'
export {
  makePortConnectionOpener,
  openInputPortConnectionByPort,
  openOutputPortConnectionByPort,
  openPortConnectionByPort,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPort.ts'
export {
  openInputPortConnectionByPortIdAndAccess,
  openOutputPortConnectionByPortIdAndAccess,
  openPortConnectionByPortIdAndAccess,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPortIdAndAccess.ts'
export {
  openInputPortConnectionByPortIdInContext,
  openOutputPortConnectionByPortIdInContext,
  openPortConnectionByPortIdInContext,
} from './internal/MIDIPortMethodCalls/openPortConnection/openPortConnectionByPortIdInContext.ts'
export {
  getInputPortByPortIdInContext,
  getOutputPortByPortIdInContext,
  getPortByPortIdInContext,
} from './internal/getPortByPortId/getPortByPortIdInContext.ts'
export {
  type AcquiredThing,
  type GetPortById,
  type GetThingByPortId,
  type GetThingByPortIdAccessFirst,
  type GetThingByPortIdAccessLast,
  type GetThingByPortIdAccessLastSecondHalf,
  getInputPortByPortIdAndAccess,
  getOutputPortByPortIdAndAccess,
  getPortByIdAndRemap,
  getPortByPortIdAndAccess,
} from './internal/getPortByPortId/getPortByPortIdAndAccess.ts'
export {
  type DualMakeStateChangesStream,
  type MakeStateChangesStreamPortFirst,
  type MakeStateChangesStreamPortLast,
  type StateChangesStream,
  makeInputPortStateChangesStreamByPort,
  makeOutputPortStateChangesStreamByPort,
  makePortStateChangesStreamByPort,
  makePortStateChangesStreamFactory,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPort.ts'
export {} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPortIdAndAccess.ts'
export {
  makeInputPortStateChangesStreamByPortIdInContext,
  makeOutputPortStateChangesStreamByPortIdInContext,
  makePortStateChangesStreamByPortIdInContext,
} from './internal/makePortStateChangesStream/makePortStateChangesStreamByPortIdInContext.ts'
export {
  isInputPortConnectionClosedByPort,
  isInputPortConnectionOpenByPort,
  isInputPortConnectionPendingByPort,
  isInputPortDeviceConnectedByPort,
  isInputPortDeviceDisconnectedByPort,
  isOutputPortConnectionClosedByPort,
  isOutputPortConnectionOpenByPort,
  isOutputPortConnectionPendingByPort,
  isOutputPortDeviceConnectedByPort,
  isOutputPortDeviceDisconnectedByPort,
  isPortConnectionClosedByPort,
  isPortConnectionOpenByPort,
  isPortConnectionPendingByPort,
  isPortDeviceConnectedByPort,
  isPortDeviceDisconnectedByPort,
} from './internal/mutablePropertyTools/doesMutablePortPropertyHaveSpecificValue/doesMutablePortPropertyHaveSpecificValueByPort.ts'
export {
  getInputPortConnectionStateByPort,
  getInputPortDeviceStateByPort,
  getOutputPortConnectionStateByPort,
  getOutputPortDeviceStateByPort,
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
  matchInputPortConnectionStateByPort,
  matchInputPortDeviceStateByPort,
  matchOutputPortConnectionStateByPort,
  matchOutputPortDeviceStateByPort,
  matchPortConnectionStateByPort,
  matchPortDeviceStateByPort,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPort.ts'
export {} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPortIdAndAccess.ts'
export {
  matchInputPortConnectionStateByPortIdInContext as matchInputPortConnectionStateByPortId,
  matchInputPortDeviceStateByPortIdInContext as matchInputPortDeviceStateByPortId,
  matchOutputPortConnectionStateByPortIdInContext as matchOutputPortConnectionStateByPortId,
  matchOutputPortDeviceStateByPortIdInContext as matchOutputPortDeviceStateByPortId,
  matchPortConnectionStateByPortIdInContext as matchPortConnectionStateByPortId,
  matchPortDeviceStateByPortIdInContext as matchPortDeviceStateByPortId,
} from './internal/mutablePropertyTools/matchMutablePortProperty/matchMutablePortPropertyByPortIdInContext.ts'

export {} from './internal/EMIDIAccess.ts'
export {} from './internal/EMIDIInputPort.ts'
export {} from './internal/EMIDIOutputPort.ts'
export {} from './internal/EMIDIPort.ts'
// export {
//   acquireReleasePortConnectionByPortId as acquireReleaseConnectionById,
//   closePortConnectionByPortId as closeConnectionById,
//   getPortConnectionStateByPortId as getConnectionStateById,
//   getPortDeviceStateByPortId as getDeviceStateById,
//   makePortStateChangesStreamByPortId as makeStateChangesStreamById,
//   matchPortConnectionStateByPortId as matchConnectionStateById,
//   matchPortDeviceStateByPortId as matchDeviceStateById,
//   openPortConnectionByPortId as openConnectionById,
// } from './internal/contextualFunctions.ts'

export {
  acquireReleaseConnection,
  assert,
  closeConnection,
  type DualMakeStateChangesStream,
  type DualMatchPortState,
  type EMIDIPort,
  getConnectionState,
  getDeviceState,
  is,
  isConnectionClosed,
  isConnectionOpen,
  isConnectionPending,
  isDeviceConnected,
  isDeviceDisconnected,
  type MakeStateChangesStreamPortFirst,
  type MakeStateChangesStreamPortLast,
  type MatcherConfigPlain,
  type MatchResult,
  type MatchStatePortFirst,
  type MatchStatePortLast,
  type MIDIPortMutableProperty,
  makeStateChangesStream,
  matchConnectionState,
  matchDeviceState,
  openConnection,
  type PolymorphicPort,
  type PortStateHandler,
  type StateCaseToHandlerMap,
  type StateChangesStream,
  type TypeId,
} from './internal/EMIDIPort.ts'
