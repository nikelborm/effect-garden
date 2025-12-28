/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Record from 'effect/Record'
import * as EMIDIInput from '../../EMIDIInput.ts'
import * as EMIDIOutput from '../../EMIDIOutput.ts'
import * as EMIDIPort from '../../EMIDIPort.ts'
import * as Util from '../../Util.ts'
import * as Get from '../getValueInRawPortFieldUnsafe.ts'

/**
 * @internal
 */
const matchMutableMIDIPortProperty = <
  const TMIDIPortProperty extends MIDIPortMutableProperty,
  THighLevelPortType extends MIDIPortType,
>(
  property: TMIDIPortProperty,
  is: (port: unknown) => port is EMIDIPort.EMIDIPort<THighLevelPortType>,
): DualMatchPortState<THighLevelPortType, TMIDIPortProperty> =>
  EFunction.dual<
    MatchStatePortLast<THighLevelPortType, TMIDIPortProperty>,
    MatchStatePortFirst<THighLevelPortType, TMIDIPortProperty>
  >(
    Util.polymorphicCheckInDual(is),
    Effect.fn(function* (polymorphicPort, config) {
      const port = yield* Util.fromPolymorphic(
        polymorphicPort,
        is as (
          port: unknown,
        ) => port is EMIDIPort.EMIDIPort<THighLevelPortType>,
      )

      const state = Get.getValueInRawPortFieldUnsafe(property)(port)

      for (const [stateCase, stateCallback] of Record.toEntries(config))
        if (state === stateCase)
          return (stateCallback as PortStateHandler)(port)

      return yield* Effect.dieMessage(
        `AssertionFailed: Missing handler for "${state}" state inside "${property}" property`,
      )
    }),
  )

/**
 *
 */
export const matchPortConnectionStateByPort = matchMutableMIDIPortProperty(
  'connection',
  EMIDIPort.is,
)

/**
 *
 */
export const matchPortDeviceStateByPort = matchMutableMIDIPortProperty(
  'state',
  EMIDIPort.is,
)

/**
 *
 */
export const matchInputConnectionStateByPort = matchMutableMIDIPortProperty(
  'connection',
  EMIDIInput.is,
)

/**
 *
 */
export const matchInputDeviceStateByPort = matchMutableMIDIPortProperty(
  'state',
  EMIDIInput.is,
)

/**
 *
 */
export const matchOutputConnectionStateByPort = matchMutableMIDIPortProperty(
  'connection',
  EMIDIOutput.is,
)

/**
 *
 */
export const matchOutputDeviceStateByPort = matchMutableMIDIPortProperty(
  'state',
  EMIDIOutput.is,
)

export type MIDIPortMutableProperty = 'state' | 'connection'

export interface PortStateHandler {
  // biome-ignore lint/suspicious/noExplicitAny: <There's no better way to type>
  (port: EMIDIPort.EMIDIPort): any
}
export interface MatcherConfigPlain extends Record<string, PortStateHandler> {}

export interface MatchResult<TActualConf extends MatcherConfigPlain, E, R>
  extends Effect.Effect<ReturnType<TActualConf[keyof TActualConf]>, E, R> {}

export interface DualMatchPortState<
  THighLevelPortType extends MIDIPortType,
  TMIDIPortProperty extends MIDIPortMutableProperty,
> extends MatchStatePortLast<THighLevelPortType, TMIDIPortProperty>,
    MatchStatePortFirst<THighLevelPortType, TMIDIPortProperty> {}

export interface MatchStatePortFirst<
  THighLevelPortType extends MIDIPortType,
  TMIDIPortProperty extends MIDIPortMutableProperty,
> {
  /**
   * Description placeholder
   *
   * @param polymorphicPort
   * @param stateCaseToHandlerMap
   * @returns
   */
  <
    TStateCaseToHandlerMap extends StateCaseToHandlerMap<
      TMIDIPortProperty,
      THighLevelPortType,
      TStateCaseToHandlerMap
    >,
    E = never,
    R = never,
  >(
    polymorphicPort: EMIDIPort.PolymorphicPort<E, R, THighLevelPortType>,
    stateCaseToHandlerMap: TStateCaseToHandlerMap,
  ): MatchResult<TStateCaseToHandlerMap, E, R>
}

export interface MatchStatePortLast<
  THighLevelPortType extends MIDIPortType,
  TMIDIPortProperty extends MIDIPortMutableProperty,
> {
  /**
   * Description placeholder
   *
   * @param stateCaseToHandlerMap
   * @returns
   */
  <
    TStateCaseToHandlerMap extends StateCaseToHandlerMap<
      TMIDIPortProperty,
      THighLevelPortType,
      TStateCaseToHandlerMap
    >,
  >(
    stateCaseToHandlerMap: TStateCaseToHandlerMap,
  ): {
    /**
     * Description placeholder
     *
     * @param polymorphicPort
     * @returns
     */
    <E = never, R = never>(
      polymorphicPort: EMIDIPort.PolymorphicPort<E, R, THighLevelPortType>,
    ): MatchResult<TStateCaseToHandlerMap, E, R>
  }
}

export type StateCaseToHandlerMap<
  TMIDIPortProperty extends MIDIPortMutableProperty,
  TMIDIPortType extends MIDIPortType,
  TConfigSelf,
> = {
  readonly [StateCase in MIDIPort[TMIDIPortProperty]]: (
    port: EMIDIPort.EMIDIPort<TMIDIPortType>,
    // biome-ignore lint/suspicious/noExplicitAny: <There's no preciser type>
  ) => any
} & {
  readonly [RedundantValueCaseHandling in Exclude<
    keyof TConfigSelf,
    MIDIPort[TMIDIPortProperty]
  >]: never
}
