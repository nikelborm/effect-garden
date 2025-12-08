export {
  makeInputPortStateChangesStreamByPortId as makeStateChangesStreamById,
  makeMessagesStreamByPortId as makeMessagesStreamById,
  matchInputPortConnectionStateByPortId as matchConnectionStateById,
  matchInputPortDeviceStateByPortId as matchDeviceStateById,
} from './internal/contextualFunctions.ts'

export {
  assert,
  type EffectfulMIDIInputPort,
  is,
  makeMessagesStream,
  makeStateChangesStream,
  matchConnectionState,
  matchDeviceState,
} from './internal/EffectfulMIDIInputPort.ts'
