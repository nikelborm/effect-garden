import * as EffectfulMIDIInputPort from '../../../EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from '../../../EffectfulMIDIOutputPort.ts'
import * as EffectfulMIDIPort from '../../../EffectfulMIDIPort.ts'
import { makeMIDIPortMethodCallerFactory } from '../makeMIDIPortMethodCallerFactory.ts'

/**
 * @internal
 */
export const makePortConnectionCloser = makeMIDIPortMethodCallerFactory(
  'close',
  err => {
    throw err
  },
)

/**
 *
 */
export const closePortConnectionByPort = makePortConnectionCloser(
  EffectfulMIDIPort.is,
)

/**
 *
 */
export const closeInputPortConnectionByPort = makePortConnectionCloser(
  EffectfulMIDIInputPort.is,
)

/**
 *
 */
export const closeOutputPortConnectionByPort = makePortConnectionCloser(
  EffectfulMIDIOutputPort.is,
)
