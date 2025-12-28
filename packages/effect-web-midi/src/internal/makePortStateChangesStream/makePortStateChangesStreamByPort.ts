/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as EMIDIInput from '../EMIDIInput.ts'
import * as EMIDIOutput from '../EMIDIOutput.ts'
import * as EMIDIPort from '../EMIDIPort.ts'
import * as StreamMaker from '../StreamMaker.ts'
import * as Util from '../util.ts'

/**
 *
 * @internal
 */
const makePortStateChangesStreamFactory = <
  THighLevelPortType extends MIDIPortType,
>(
  is: (port: unknown) => port is EMIDIPort.EMIDIPort<THighLevelPortType>,
) =>
  StreamMaker.createStreamMakerFrom<MIDIPortEventMap>()(
    is,
    port => ({
      tag: 'MIDIPortStateChange',
      eventListener: {
        target: EMIDIPort.assumeImpl(port)._port,
        type: 'statechange',
      },
      spanAttributes: {
        spanTargetName: 'MIDI port',
        port: Util.getStaticMIDIPortInfo(port),
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
    // TODO: check this type is actually needed
  ) as DualMakeStateChangesStream<THighLevelPortType>

/**
 * Function to create a stream of remapped {@linkcode MIDIConnectionEvent}s
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
export const makePortStateChangesStreamByPort =
  makePortStateChangesStreamFactory(EMIDIPort.is)

/**
 * Function to create a stream of remapped {@linkcode MIDIConnectionEvent}s
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
export const makeInputStateChangesStreamByPort =
  makePortStateChangesStreamFactory(EMIDIInput.is)

/**
 * Function to create a stream of remapped {@linkcode MIDIConnectionEvent}s
 *
 * [MDN
 * Reference](https://developer.mozilla.org/docs/Web/API/MIDIConnectionEvent)
 */
export const makeOutputStateChangesStreamByPort =
  makePortStateChangesStreamFactory(EMIDIOutput.is)

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
    const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined,
    E = never,
    R = never,
  >(
    polymorphicPort: EMIDIPort.PolymorphicPort<E, R, TPortType>,
    options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
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
  <const TOnNullStrategy extends StreamMaker.OnNullStrategy = undefined>(
    options?: StreamMaker.StreamMakerOptions<TOnNullStrategy>,
  ): {
    /**
     *
     *
     */
    <TPortType extends THighLevelPortType, E = never, R = never>(
      polymorphicPort: EMIDIPort.PolymorphicPort<E, R, TPortType>,
    ): StateChangesStream<TOnNullStrategy, TPortType, E, R>
  }
}

/**
 * A custom type is needed because the port type will be generic, but this is
 * not possible if using just {@linkcode createStreamMakerFrom}
 */
export interface StateChangesStream<
  TOnNullStrategy extends StreamMaker.OnNullStrategy,
  TPortType extends MIDIPortType,
  E = never,
  R = never,
> extends StreamMaker.BuiltStream<
    'MIDIPortStateChange',
    EMIDIPort.EMIDIPort<TPortType>,
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
