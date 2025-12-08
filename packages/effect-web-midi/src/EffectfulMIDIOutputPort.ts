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
  type EffectfulMIDIOutputPort,
  is,
  makeStateChangesStream,
  matchConnectionState,
  matchDeviceState,
  type SendFromPortArgs,
  type SendMIDIMessagePortFirst,
  type SendMIDIMessagePortLast,
  type SentMessageEffectFromPort,
  send,
} from './internal/EffectfulMIDIOutputPort.ts'
