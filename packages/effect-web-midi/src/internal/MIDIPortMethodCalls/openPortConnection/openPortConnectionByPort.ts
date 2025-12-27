import * as EMIDIInputPort from '../../EMIDIInputPort.ts'
import * as EMIDIOutputPort from '../../EMIDIOutputPort.ts'
import * as EMIDIPort from '../../EMIDIPort.ts'
import { remapErrorByName, UnavailablePortError } from '../../errors.ts'
import { makeMIDIPortMethodCallerFactory } from '../makeMIDIPortMethodCallerFactory.ts'

/**
 * @internal
 *
 * exported for acquire-release
 */
export const makePortConnectionOpener = makeMIDIPortMethodCallerFactory(
  'open',
  portId =>
    remapErrorByName(
      {
        NotAllowedError: UnavailablePortError,
        // InvalidAccessError is kept for compatibility reason
        // (https://github.com/WebAudio/web-midi-api/pull/278):
        InvalidAccessError: UnavailablePortError,

        InvalidStateError: UnavailablePortError,
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
export const openInputPortConnectionByPort = makePortConnectionOpener(
  EMIDIInputPort.is,
)

/**
 *
 */
export const openOutputPortConnectionByPort = makePortConnectionOpener(
  EMIDIOutputPort.is,
)
