import * as Effect from 'effect/Effect'
import * as EMIDIInputPort from '../../EMIDIInputPort.ts'
import * as EMIDIOutputPort from '../../EMIDIOutputPort.ts'
import * as EMIDIPort from '../../EMIDIPort.ts'
import { makePortConnectionCloser } from '../closePortConnection/closePortConnectionByPort.ts'
import { makePortConnectionOpener } from '../openPortConnection/openPortConnectionByPort.ts'

/**
 * @internal
 */
export const makeConnectionAcquirerReleaser =
  <THighLevelPortType extends MIDIPortType>(
    is: (port: unknown) => port is EMIDIPort.EMIDIPort<THighLevelPortType>,
  ) =>
  /**
   * @returns An effect with the same port for easier chaining of operations
   */
  <TPortType extends THighLevelPortType, E = never, R = never>(
    port: EMIDIPort.PolymorphicPort<E, R, TPortType>,
  ) =>
    Effect.acquireRelease(
      makePortConnectionOpener(is)(port),
      makePortConnectionCloser(is),
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
