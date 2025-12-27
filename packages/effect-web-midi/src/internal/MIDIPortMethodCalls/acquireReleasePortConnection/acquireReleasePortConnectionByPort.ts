import * as Effect from 'effect/Effect'
import type * as Scope from 'effect/Scope'
import * as EMIDIInputPort from '../../EMIDIInputPort.ts'
import * as EMIDIOutputPort from '../../EMIDIOutputPort.ts'
import * as EMIDIPort from '../../EMIDIPort.ts'
import type { UnavailablePortError } from '../../errors.ts'
import * as C from '../closePortConnection/closePortConnectionByPort.ts'
import type { TouchPort } from '../makeMIDIPortMethodCallerFactory.ts'
import * as O from '../openPortConnection/openPortConnectionByPort.ts'

/**
 * @internal
 */
export const makeConnectionAcquirerReleaser =
  <THighLevelPortType extends MIDIPortType>(
    is: (port: unknown) => port is EMIDIPort.EMIDIPort<THighLevelPortType>,
  ): TouchPort<UnavailablePortError, Scope.Scope, THighLevelPortType> =>
  /**
   * @returns An effect with the same port for easier chaining of operations
   */
  port =>
    Effect.acquireRelease(
      O.makePortConnectionOpener(is)(port),
      C.makePortConnectionCloser(is),
    )

/**
 *
 */
export const acquireReleasePortConnectionByPort =
  makeConnectionAcquirerReleaser(EMIDIPort.is)

/**
 *
 */
export const acquireReleaseInputPortConnectionByPort =
  makeConnectionAcquirerReleaser(EMIDIInputPort.is)

/**
 *
 */
export const acquireReleaseOutputPortConnectionByPort =
  makeConnectionAcquirerReleaser(EMIDIOutputPort.is)
