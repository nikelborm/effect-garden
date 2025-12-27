/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as EMIDIInput from '../../EMIDIInput.ts'
import * as EMIDIOutput from '../../EMIDIOutput.ts'
import * as EMIDIPort from '../../EMIDIPort.ts'
import * as F from '../makeMIDIPortMethodCallerFactory.ts'

/**
 * @internal
 *
 * exported for acquire-release
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
export const closeInputConnectionByPort = makePortConnectionCloser(
  EMIDIInput.is,
)

/**
 *
 */
export const closeOutputConnectionByPort = makePortConnectionCloser(
  EMIDIOutput.is,
)
