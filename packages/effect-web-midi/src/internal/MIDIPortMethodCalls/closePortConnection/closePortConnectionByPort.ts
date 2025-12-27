/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as EMIDIInputPort from '../../EMIDIInputPort.ts'
import * as EMIDIOutputPort from '../../EMIDIOutputPort.ts'
import * as EMIDIPort from '../../EMIDIPort.ts'
import * as F from '../makeMIDIPortMethodCallerFactory.ts'

/**
 * @internal
 */
export const makePortConnectionCloser = F.makeMIDIPortMethodCallerFactory(
  'close',
  () => err => {
    throw err
  },
)

/**
 *
 */
export const closePortConnectionByPort = makePortConnectionCloser(EMIDIPort.is)

/**
 *
 */
export const closeInputPortConnectionByPort = makePortConnectionCloser(
  EMIDIInputPort.is,
)

/**
 *
 */
export const closeOutputPortConnectionByPort = makePortConnectionCloser(
  EMIDIOutputPort.is,
)
