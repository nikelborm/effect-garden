import * as EffectfulMIDIInputPort from '../../../EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from '../../../EffectfulMIDIOutputPort.ts'
import * as EffectfulMIDIPort from '../../../EffectfulMIDIPort.ts'
import { MIDIPortMethodCallerFactory } from '../MIDIPortMethodCallerFactory.ts'

/**
 * @internal
 */
export const closeConnectionFactory = MIDIPortMethodCallerFactory(
  'close',
  err => {
    throw err
  },
)

/**
 *
 */
export const closePortConnectionByPort = closeConnectionFactory(
  EffectfulMIDIPort.is,
)

/**
 *
 */
export const closeInputPortConnectionByPort = closeConnectionFactory(
  EffectfulMIDIInputPort.is,
)

/**
 *
 */
export const closeOutputPortConnectionByPort = closeConnectionFactory(
  EffectfulMIDIOutputPort.is,
)
