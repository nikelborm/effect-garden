import * as EffectfulMIDIInputPort from '../../../EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from '../../../EffectfulMIDIOutputPort.ts'
import * as EffectfulMIDIPort from '../../../EffectfulMIDIPort.ts'
import { remapErrorByName, UnavailablePortError } from '../../../errors.ts'
import { MIDIPortMethodCallerFactory } from '../MIDIPortMethodCallerFactory.ts'

/**
 * @internal
 */
export const openConnectionFactory = MIDIPortMethodCallerFactory(
  'open',
  remapErrorByName(
    {
      NotAllowedError: UnavailablePortError,
      // Kept for compatibility reason (https://github.com/WebAudio/web-midi-api/pull/278):
      InvalidAccessError: UnavailablePortError,

      InvalidStateError: UnavailablePortError,
    },
    'MIDI port open error handling absurd',
  ),
)

/**
 *
 */
export const openPortConnectionByPort = openConnectionFactory(
  EffectfulMIDIPort.is,
)

/**
 *
 */
export const openInputPortConnectionByPort = openConnectionFactory(
  EffectfulMIDIInputPort.is,
)

/**
 *
 */
export const openOutputPortConnectionByPort = openConnectionFactory(
  EffectfulMIDIOutputPort.is,
)
