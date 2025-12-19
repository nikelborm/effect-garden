/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import {
  type BuiltStream,
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
export const makePortStateChangesStreamFactory = <
  THighLevelPortType extends MIDIPortType,
>(
  is: (
    port: unknown,
  ) => port is EffectfulMIDIPort.EffectfulMIDIPort<THighLevelPortType>,
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
  ) as DualMakeStateChangesStream<THighLevelPortType>

/**
 * Function to create a stream of remapped {@linkcode MIDIConnectionEvent}s
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
export const makePortStateChangesStreamByPort =
  makePortStateChangesStreamFactory(EffectfulMIDIPort.is)

/**
 * Function to create a stream of remapped {@linkcode MIDIConnectionEvent}s
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
export const makeInputPortStateChangesStreamByPort =
  makePortStateChangesStreamFactory(EffectfulMIDIInputPort.is)

/**
 * Function to create a stream of remapped {@linkcode MIDIConnectionEvent}s
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
export const makeOutputPortStateChangesStreamByPort =
  makePortStateChangesStreamFactory(EffectfulMIDIOutputPort.is)

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface DualMakeStateChangesStream<
  THighLevelPortType extends MIDIPortType = MIDIPortType,
> extends MakeStateChangesStreamPortFirst<THighLevelPortType>,
    MakeStateChangesStreamPortLast<THighLevelPortType> {}

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface MakeStateChangesStreamPortFirst<
  THighLevelPortType extends MIDIPortType = MIDIPortType,
> {
  /**
   * @param options Passing a value of a `boolean` type is equivalent to setting `options.capture`
   * property
   */
  <
    TPortType extends THighLevelPortType,
    const TOnNullStrategy extends OnNullStrategy = undefined,
    E = never,
    R = never,
  >(
    polymorphicPort: EffectfulMIDIPort.PolymorphicPort<E, R, TPortType>,
    options?: StreamMakerOptions<TOnNullStrategy>,
  ): StateChangesStream<TOnNullStrategy, TPortType, E, R>
}

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface MakeStateChangesStreamPortLast<
  THighLevelPortType extends MIDIPortType = MIDIPortType,
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
    <TPortType extends THighLevelPortType, E = never, R = never>(
      polymorphicPort: EffectfulMIDIPort.PolymorphicPort<E, R, TPortType>,
    ): StateChangesStream<TOnNullStrategy, TPortType, E, R>
  }
}

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface StateChangesStream<
  TOnNullStrategy extends OnNullStrategy,
  TPortType extends MIDIPortType,
  E = never,
  R = never,
> extends BuiltStream<
    'MIDIPortStateChange',
    EffectfulMIDIPort.EffectfulMIDIPort<TPortType>,
    {
      readonly newState: {
        readonly ofDevice: MIDIPortDeviceState
        readonly ofConnection: MIDIPortConnectionState
      } | null
    },
    TOnNullStrategy,
    E,
    R
  > {}
