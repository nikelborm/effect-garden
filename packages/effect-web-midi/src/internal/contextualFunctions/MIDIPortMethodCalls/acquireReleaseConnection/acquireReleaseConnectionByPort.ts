import * as Effect from 'effect/Effect'
import * as EffectfulMIDIInputPort from '../../../EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from '../../../EffectfulMIDIOutputPort.ts'
import * as EffectfulMIDIPort from '../../../EffectfulMIDIPort.ts'
import { closeConnectionFactory } from '../closeConnection/closeConnectionByPort.ts'
import { openConnectionFactory } from '../openConnection/openConnectionByPort.ts'

/**
 * @internal
 */
export const acquireReleaseConnectionFactory =
  <THighLevelType extends MIDIPortType>(
    is: (
      port: unknown,
    ) => port is EffectfulMIDIPort.EffectfulMIDIPort<THighLevelType>,
  ) =>
  /**
   * @returns An effect with the same port for easier chaining of operations
   */
  <TType extends THighLevelType, E = never, R = never>(
    port: EffectfulMIDIPort.PolymorphicPort<E, R, TType>,
  ) =>
    Effect.acquireRelease(
      openConnectionFactory(is)(port),
      closeConnectionFactory(is),
    )

/**
 *
 */
export const acquireReleasePortConnectionByPort =
  acquireReleaseConnectionFactory(EffectfulMIDIPort.is)

/**
 *
 */
export const acquireReleaseInputPortConnectionByPort =
  acquireReleaseConnectionFactory(EffectfulMIDIInputPort.is)

/**
 *
 */
export const acquireReleaseOutputPortConnectionByPort =
  acquireReleaseConnectionFactory(EffectfulMIDIOutputPort.is)
