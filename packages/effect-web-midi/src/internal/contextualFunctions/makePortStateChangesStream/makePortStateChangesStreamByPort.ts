/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import {
  createStreamMakerFrom,
  type OnNullStrategy,
  type StreamMakerOptions,
} from '../../createStreamMakerFrom.ts'
import * as EffectfulMIDIInputPort from '../../EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from '../../EffectfulMIDIOutputPort.ts'
import * as EffectfulMIDIPort from '../../EffectfulMIDIPort.ts'
import { getStaticMIDIPortInfo } from '../../util.ts'

/**
 *
 * @internal
 */
export const makePortStateChangesStreamMaker = <
  THighLevelType extends MIDIPortType,
>(
  is: (
    port: unknown,
  ) => port is EffectfulMIDIPort.EffectfulMIDIPort<THighLevelType>,
) =>
  createStreamMakerFrom<MIDIPortEventMap>()(
    is,
    port => ({
      tag: 'MIDIPortStateChange',
      eventListener: {
        target: EffectfulMIDIPort.assumeImpl(port)._port,
        type: 'statechange',
      },
      spanAttributes: {
        spanTargetName: 'MIDI port',
        port: getStaticMIDIPortInfo(port),
      },
      nullableFieldName: 'port',
    }),
    rawPort =>
      ({
        newState: rawPort
          ? ({
              ofDevice: rawPort.state,
              ofConnection: rawPort.connection,
            } as const)
          : null,
      }) as const,
  ) as DualMakeStateChangesStream

/**
 * Function to create a stream of remapped {@linkcode MIDIConnectionEvent}s
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
export const makePortStateChangesStreamByPort = makePortStateChangesStreamMaker(
  EffectfulMIDIPort.is,
)

/**
 * Function to create a stream of remapped {@linkcode MIDIConnectionEvent}s
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
export const makeInputPortStateChangesStreamByPort =
  makePortStateChangesStreamMaker(EffectfulMIDIInputPort.is)

/**
 * Function to create a stream of remapped {@linkcode MIDIConnectionEvent}s
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
export const makeOutputPortStateChangesStreamByPort =
  makePortStateChangesStreamMaker(EffectfulMIDIOutputPort.is)

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface DualMakeStateChangesStream<
  THighLevelTypeRestriction extends MIDIPortType = MIDIPortType,
> extends MakeStateChangesStreamPortFirst<THighLevelTypeRestriction>,
    MakeStateChangesStreamPortLast<THighLevelTypeRestriction> {}

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface MakeStateChangesStreamPortFirst<
  THighLevelTypeRestriction extends MIDIPortType = MIDIPortType,
> {
  /**
   * @param options Passing a value of a `boolean` type is equivalent to setting `options.capture`
   * property
   */
  <
    TType extends THighLevelTypeRestriction,
    const TOnNullStrategy extends OnNullStrategy = undefined,
    E = never,
    R = never,
  >(
    polymorphicPort: EffectfulMIDIPort.PolymorphicPort<E, R, TType>,
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): EffectfulMIDIPort.StateChangesStream<TOnNullStrategy, TType, E, R>
}

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface MakeStateChangesStreamPortLast<
  THighLevelTypeRestriction extends MIDIPortType = MIDIPortType,
> {
  /**
   * @param options Passing a value of a `boolean` type is equivalent to setting `options.capture`
   * property
   */
  <const TOnNullStrategy extends OnNullStrategy = undefined>(
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): {
    /**
     *
     *
     */
    <TType extends THighLevelTypeRestriction, E = never, R = never>(
      polymorphicPort: EffectfulMIDIPort.PolymorphicPort<E, R, TType>,
    ): EffectfulMIDIPort.StateChangesStream<TOnNullStrategy, TType, E, R>
  }
}
