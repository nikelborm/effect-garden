import * as Effect from 'effect/Effect'
import type * as Scope from 'effect/Scope'
import type * as EMIDIErrors from '../../EMIDIErrors.ts'
import * as EMIDIInput from '../../EMIDIInput.ts'
import * as EMIDIOutput from '../../EMIDIOutput.ts'
import * as EMIDIPort from '../../EMIDIPort.ts'
import * as Close from '../closePortConnection/closePortConnectionByPort.ts'
import type { TouchPort } from '../makeMIDIPortMethodCallerFactory.ts'
import * as Open from '../openPortConnection/openPortConnectionByPort.ts'

/**
 * @internal
 */
const makeConnectionAcquirerReleaser =
  <THighLevelPortType extends MIDIPortType>(
    is: (port: unknown) => port is EMIDIPort.EMIDIPort<THighLevelPortType>,
  ): TouchPort<
    EMIDIErrors.UnavailablePortError,
    Scope.Scope,
    THighLevelPortType
  > =>
  /**
   * @returns An effect with the same port for easier chaining of operations
   */
  port =>
    Effect.acquireRelease(
      Open.makePortConnectionOpener(is)(port),
      Close.makePortConnectionCloser(is),
    )

/**
 *
 */
export const acquireReleasePortConnectionByPort =
  makeConnectionAcquirerReleaser(EMIDIPort.is)

/**
 *
 */
export const acquireReleaseInputConnectionByPort =
  makeConnectionAcquirerReleaser(EMIDIInput.is)

/**
 *
 */
export const acquireReleaseOutputConnectionByPort =
  makeConnectionAcquirerReleaser(EMIDIOutput.is)
