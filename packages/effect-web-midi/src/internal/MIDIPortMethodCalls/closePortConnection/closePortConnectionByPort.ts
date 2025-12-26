/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import { flow, dual, pipe } from 'effect/Function'
import * as EMIDIInputPort from '../../EMIDIInputPort.ts'
import * as EMIDIOutputPort from '../../EMIDIOutputPort.ts'
import * as EMIDIAccess from '../../EMIDIAccess.ts'
import * as EMIDIPort from '../../EMIDIPort.ts'
import {
  getInputPortByPortIdAndAccess,
  getOutputPortByPortIdAndAccess,
  getPortByPortIdAndAccess,
  type GetPortById,
  type GetPortByIdAccessFirst,
} from '../../getPortByPortId/getPortByPortIdAndAccess.ts'
import { makeMIDIPortMethodCallerFactory } from '../makeMIDIPortMethodCallerFactory.ts'
import type { MIDIBothPortId, MIDIPortId } from '../../util.ts'
import * as Effect from 'effect/Effect'
import type { PortNotFoundError } from '../../errors.ts'

/**
 * @internal
 */
export const makePortConnectionCloser = makeMIDIPortMethodCallerFactory(
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
