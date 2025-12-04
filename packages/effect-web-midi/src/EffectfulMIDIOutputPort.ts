export {
  clear,
  type DualMIDIMessageSenderPort,
  type EffectfulMIDIOutputPort,
  is,
  type MIDIMessageSenderPortFirst,
  type MIDIMessageSenderPortLast,
  makeStateChangesStream,
  matchConnectionState,
  matchDeviceState,
  type SentMessageEffectFromPort,
  send,
} from './internal/EffectfulMIDIOutputPort.ts'
