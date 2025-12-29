import * as EMIDIErrors from '../../EMIDIErrors.ts'
import * as EMIDIInput from '../../EMIDIInput.ts'
import * as EMIDIOutput from '../../EMIDIOutput.ts'
import * as EMIDIPort from '../../EMIDIPort.ts'
import { makeMIDIPortMethodCallerFactory } from '../makeMIDIPortMethodCallerFactory.ts'

/**
 * @internal
 *
 * exported for acquire-release
 */
export const makePortConnectionOpener = makeMIDIPortMethodCallerFactory(
  'open',
  portId =>
    EMIDIErrors.remapErrorByName(
      {
        NotAllowedError: EMIDIErrors.UnavailablePortError,
        // InvalidAccessError is kept for compatibility reason
        // (https://github.com/WebAudio/web-midi-api/pull/278):
        InvalidAccessError: EMIDIErrors.UnavailablePortError,

        InvalidStateError: EMIDIErrors.UnavailablePortError,
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
