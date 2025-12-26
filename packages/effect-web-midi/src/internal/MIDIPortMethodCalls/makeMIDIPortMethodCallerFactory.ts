/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
import * as EMIDIPort from '../EMIDIPort.ts'
import {
  fromPolymorphic,
  getStaticMIDIPortInfo,
  type FallbackOnUnknownOrAny,
  type MIDIBothPortId,
} from '../util.ts'

/**
 * @internal
 */
export const makeMIDIPortMethodCallerFactory =
  <TError = never>(
    method: 'close' | 'open',
    mapError: (portId: MIDIBothPortId) => (err: unknown) => TError,
  ) =>
  <THighLevelPortType extends MIDIPortType>(
    is: (port: unknown) => port is EMIDIPort.EMIDIPort<THighLevelPortType>,
  ): TouchPort<TError, never, never, THighLevelPortType> =>
    Effect.fn(`EMIDIPort.${method}`)(function* <
      TPortType extends THighLevelPortType,
      TPortGettingError = never,
      TPortGettingRequirement = never,
    >(
      polymorphicPort: EMIDIPort.PolymorphicPort<
        TPortGettingError,
        TPortGettingRequirement,
        TPortType
      >,
    ) {
      const port = yield* fromPolymorphic(
        polymorphicPort,
        is as unknown as (
          port: unknown,
        ) => port is EMIDIPort.EMIDIPort<TPortType>,
      ) as Effect.Effect<
        EMIDIPort.EMIDIPort<TPortType>,
        TError | FallbackOnUnknownOrAny<TPortGettingError, never>,
        FallbackOnUnknownOrAny<TPortGettingRequirement, never>
      >

      yield* Effect.annotateCurrentSpan({
        method,
        port: getStaticMIDIPortInfo(port),
      })

      yield* Effect.tryPromise({
        try: () => EMIDIPort.assumeImpl(port)._port[method](),
        catch: mapError(port.id),
      })

      return port
    })

type TouchPort<
  TError,
  TPortGettingFallbackError,
  TPortGettingFallbackRequirement,
  THighLevelPortType extends MIDIPortType,
> = {
  /**
   * @returns An effect with the same port for easier chaining of operations
   */
  <
    TPortType extends THighLevelPortType,
    TPortGettingError = never,
    TPortGettingRequirement = never,
  >(
    polymorphicPort: EMIDIPort.PolymorphicPort<
      TPortGettingError,
      TPortGettingRequirement,
      TPortType
    >,
  ): Effect.Effect<
    EMIDIPort.EMIDIPort<TPortType>,
    | FallbackOnUnknownOrAny<TPortGettingError, TPortGettingFallbackError>
    | TError,
    FallbackOnUnknownOrAny<
      TPortGettingRequirement,
      TPortGettingFallbackRequirement
    >
  >
}
