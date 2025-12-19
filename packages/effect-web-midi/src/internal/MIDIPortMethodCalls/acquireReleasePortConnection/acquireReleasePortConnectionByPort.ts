import * as Effect from 'effect/Effect'
import * as EffectfulMIDIInputPort from '../../EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from '../../EffectfulMIDIOutputPort.ts'
import * as EffectfulMIDIPort from '../../EffectfulMIDIPort.ts'
import { makePortConnectionCloser } from '../closePortConnection/closePortConnectionByPort.ts'
import { makePortConnectionOpener } from '../openPortConnection/openPortConnectionByPort.ts'

/**
 * @internal
 */
export const makeConnectionAcquirerReleaser =
  <THighLevelPortType extends MIDIPortType>(
    is: (
      port: unknown,
    ) => port is EffectfulMIDIPort.EffectfulMIDIPort<THighLevelPortType>,
  ) =>
  /**
   * @returns An effect with the same port for easier chaining of operations
   */
  <TPortType extends THighLevelPortType, E = never, R = never>(
    port: EffectfulMIDIPort.PolymorphicPort<E, R, TPortType>,
  ) =>
    Effect.acquireRelease(
      makePortConnectionOpener(is)(port),
      makePortConnectionCloser(is),
    )

/**
 *
 */
export const acquireReleasePortConnectionByPort =
  makeConnectionAcquirerReleaser(EffectfulMIDIPort.is)

/**
 *
 */
export const acquireReleaseInputPortConnectionByPort =
  makeConnectionAcquirerReleaser(EffectfulMIDIInputPort.is)

/**
 *
 */
export const acquireReleaseOutputPortConnectionByPort =
  makeConnectionAcquirerReleaser(EffectfulMIDIOutputPort.is)
