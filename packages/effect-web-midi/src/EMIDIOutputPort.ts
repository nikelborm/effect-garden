export {
  clearPortById as clearById,
  makeOutputPortStateChangesStreamByPortId as makeStateChangesStreamById,
  matchOutputPortConnectionStateByPortId as matchConnectionStateById,
  matchOutputPortDeviceStateByPortId as matchDeviceStateById,
  sendToPortById as sendById,
} from './internal/contextualFunctions.ts'

export {
  assert,
  clear,
  type DualSendMIDIMessageFromPort,
  type EMIDIOutputPort,
  is,
  makeStateChangesStream,
  matchConnectionState,
  matchDeviceState,
  type PolymorphicOutputPort,
  type SendFromPortArgs,
  type SendMIDIMessagePortFirst,
  type SendMIDIMessagePortLast,
  type SentMessageEffectFromPort,
  send,
} from './internal/EMIDIOutputPort.ts'
