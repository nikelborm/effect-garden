import * as EMIDIInput from '../../EMIDIInput.ts'
import * as EMIDIOutput from '../../EMIDIOutput.ts'
import * as EMIDIPort from '../../EMIDIPort.ts'
import * as MIDIErrors from '../../MIDIErrors.ts'
import { makeMIDIPortMethodCallerFactory } from '../makeMIDIPortMethodCallerFactory.ts'

/**
 * @internal
 *
 * exported for acquire-release
 */
export const makePortConnectionOpener = makeMIDIPortMethodCallerFactory(
  'open',
  portId =>
    MIDIErrors.remapErrorByName(
      {
        NotAllowedError: MIDIErrors.CannotOpenUnavailablePortError,
        // InvalidAccessError is kept for compatibility reason
        // (https://github.com/WebAudio/web-midi-api/pull/278):
        InvalidAccessError: MIDIErrors.CannotOpenUnavailablePortError,

        // InvalidStateError is not mentioned in the list of possible failures
        // of `.open()` method in the specification, but given `.send()` throws
        // `InvalidStateError`, when the port is "disconnected", this remapping
        // wouldn't hurt
        InvalidStateError: MIDIErrors.CannotOpenUnavailablePortError,
      },
      'MIDI port open error handling absurd',
      { portId },
    ),
)

/**
 *
 */
export const openPortConnectionByPort = makePortConnectionOpener(EMIDIPort.is)

/**
 *
 */
export const openInputConnectionByPort = makePortConnectionOpener(EMIDIInput.is)

/**
 *
 */
export const openOutputConnectionByPort = makePortConnectionOpener(
  EMIDIOutput.is,
)
