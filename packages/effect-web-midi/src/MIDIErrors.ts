export {
  AbortError,
  CantSendSysexMessagesError,
  ClearingSendingQueueIsNotSupportedError,
  DisconnectedPortError,
  MalformedMidiMessageError,
  MIDIAccessNotAllowedError,
  MIDIAccessNotSupportedError,
  PortNotFoundError,
  // remapErrorByName,
  UnavailablePortError,
  UnderlyingSystemError,
} from './internal/EMIDIErrors.ts'
