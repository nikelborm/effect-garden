export {
  makeInputPortStateChangesStreamByPortId as makeStateChangesStreamById,
  makeMessagesStreamByPortId as makeMessagesStreamById,
  matchInputPortConnectionStateByPortId as matchConnectionStateById,
  matchInputPortDeviceStateByPortId as matchDeviceStateById,
} from './internal/contextualFunctions.ts'

export {
  assert,
  type EMIDIInputPort,
  is,
  makeMessagesStream,
  makeStateChangesStream,
  matchConnectionState,
  matchDeviceState,
} from './internal/EMIDIInputPort.ts'
