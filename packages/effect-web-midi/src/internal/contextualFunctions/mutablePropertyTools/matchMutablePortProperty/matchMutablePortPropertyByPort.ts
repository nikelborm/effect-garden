/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */
import * as Effect from 'effect/Effect'
import { dual } from 'effect/Function'
import * as Record from 'effect/Record'
import * as EffectfulMIDIInputPort from '../../../EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from '../../../EffectfulMIDIOutputPort.ts'
import * as EffectfulMIDIPort from '../../../EffectfulMIDIPort.ts'
import { fromPolymorphic, polymorphicCheckInDual } from '../../../util.ts'
import { getValueInRawPortFieldUnsafe } from '../mutablePropertyTools.ts'

/**
 * @internal
 */
export const matchMutableMIDIPortProperty = <
  const TMIDIPortProperty extends MIDIPortMutableProperty,
  THighLevelType extends MIDIPortType,
>(
  property: TMIDIPortProperty,
  is: (
    port: unknown,
  ) => port is EffectfulMIDIPort.EffectfulMIDIPort<THighLevelType>,
): DualMatchPortState<THighLevelType, TMIDIPortProperty> =>
  dual<
    MatchStatePortLast<THighLevelType, TMIDIPortProperty>,
    MatchStatePortFirst<THighLevelType, TMIDIPortProperty>
  >(
    polymorphicCheckInDual(is),
    Effect.fn(function* (polymorphicPort, config) {
      const port = yield* fromPolymorphic(
        polymorphicPort,
        is as (
          port: unknown,
        ) => port is EffectfulMIDIPort.EffectfulMIDIPort<THighLevelType>,
      )

      const state = getValueInRawPortFieldUnsafe(property)(port)

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
  EffectfulMIDIPort.is,
)

/**
 *
 */
export const matchPortDeviceStateByPort = matchMutableMIDIPortProperty(
  'state',
  EffectfulMIDIPort.is,
)

/**
 *
 */
export const matchInputPortConnectionStateByPort = matchMutableMIDIPortProperty(
  'connection',
  EffectfulMIDIInputPort.is,
)

/**
 *
 */
export const matchInputPortDeviceStateByPort = matchMutableMIDIPortProperty(
  'state',
  EffectfulMIDIInputPort.is,
)

/**
 *
 */
export const matchOutputPortConnectionStateByPort =
  matchMutableMIDIPortProperty('connection', EffectfulMIDIOutputPort.is)

/**
 *
 */
export const matchOutputPortDeviceStateByPort = matchMutableMIDIPortProperty(
  'state',
  EffectfulMIDIOutputPort.is,
)

export type MIDIPortMutableProperty = 'state' | 'connection'

export interface PortStateHandler {
  // biome-ignore lint/suspicious/noExplicitAny: <There's no better way to type>
  (port: EffectfulMIDIPort.EffectfulMIDIPort): any
}
export interface MatcherConfigPlain extends Record<string, PortStateHandler> {}

export interface MatchResult<TActualConf extends MatcherConfigPlain, E, R>
  extends Effect.Effect<ReturnType<TActualConf[keyof TActualConf]>, E, R> {}

export interface DualMatchPortState<
  TMIDIPortTypeHighLevelRestriction extends MIDIPortType,
  TMIDIPortProperty extends MIDIPortMutableProperty,
> extends MatchStatePortLast<
      TMIDIPortTypeHighLevelRestriction,
      TMIDIPortProperty
    >,
    MatchStatePortFirst<TMIDIPortTypeHighLevelRestriction, TMIDIPortProperty> {}

export interface MatchStatePortFirst<
  TMIDIPortTypeHighLevelRestriction extends MIDIPortType,
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
      TMIDIPortTypeHighLevelRestriction,
      TStateCaseToHandlerMap
    >,
    E = never,
    R = never,
  >(
    polymorphicPort: EffectfulMIDIPort.PolymorphicPort<
      E,
      R,
      TMIDIPortTypeHighLevelRestriction
    >,
    stateCaseToHandlerMap: TStateCaseToHandlerMap,
  ): MatchResult<TStateCaseToHandlerMap, E, R>
}

export interface MatchStatePortLast<
  TMIDIPortTypeHighLevelRestriction extends MIDIPortType,
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
      TMIDIPortTypeHighLevelRestriction,
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
      polymorphicPort: EffectfulMIDIPort.PolymorphicPort<
        E,
        R,
        TMIDIPortTypeHighLevelRestriction
      >,
    ): MatchResult<TStateCaseToHandlerMap, E, R>
  }
}

export type StateCaseToHandlerMap<
  TMIDIPortProperty extends MIDIPortMutableProperty,
  TMIDIPortType extends MIDIPortType,
  TConfigSelf,
> = {
  readonly [StateCase in MIDIPort[TMIDIPortProperty]]: (
    port: EffectfulMIDIPort.EffectfulMIDIPort<TMIDIPortType>,
    // biome-ignore lint/suspicious/noExplicitAny: <There's no preciser type>
  ) => any
} & {
  readonly [RedundantValueCaseHandling in Exclude<
    keyof TConfigSelf,
    MIDIPort[TMIDIPortProperty]
  >]: never
}
