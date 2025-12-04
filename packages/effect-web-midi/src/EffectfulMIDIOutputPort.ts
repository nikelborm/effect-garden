export {
  clear,
  type DualSendMIDIMessageFromPort,
  type EffectfulMIDIOutputPort,
  is,
  type SendMIDIMessagePortFirst,
  type SendMIDIMessagePortLast,
  makeStateChangesStream,
  matchConnectionState,
  matchDeviceState,
  type SentMessageEffectFromPort,
  send,
} from './internal/EffectfulMIDIOutputPort.ts'
