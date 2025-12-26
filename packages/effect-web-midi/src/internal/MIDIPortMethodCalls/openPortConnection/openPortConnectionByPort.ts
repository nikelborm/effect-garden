import * as EffectfulMIDIInputPort from '../../EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from '../../EffectfulMIDIOutputPort.ts'
import * as EffectfulMIDIPort from '../../EffectfulMIDIPort.ts'
import { remapErrorByName, UnavailablePortError } from '../../errors.ts'
import { makeMIDIPortMethodCallerFactory } from '../makeMIDIPortMethodCallerFactory.ts'

/**
 * @internal
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
export const openPortConnectionByPort = makePortConnectionOpener(
  EffectfulMIDIPort.is,
)

const ass = openPortConnectionByPort(
  {} as EffectfulMIDIPort.PolymorphicPort<'1', '2', 'output'>,
)

/**
 *
 */
export const openInputPortConnectionByPort = makePortConnectionOpener(
  EffectfulMIDIInputPort.is,
)

/**
 *
 */
export const openOutputPortConnectionByPort = makePortConnectionOpener(
  EffectfulMIDIOutputPort.is,
)
