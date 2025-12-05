export {
  clear,
  type DualSendMIDIMessageFromPort,
  type EffectfulMIDIOutputPort,
  is,
  makeStateChangesStream,
  matchConnectionState,
  matchDeviceState,
  type SendMIDIMessagePortFirst,
  type SendMIDIMessagePortLast,
  type SentMessageEffectFromPort,
  send,
} from './internal/EffectfulMIDIOutputPort.ts'
