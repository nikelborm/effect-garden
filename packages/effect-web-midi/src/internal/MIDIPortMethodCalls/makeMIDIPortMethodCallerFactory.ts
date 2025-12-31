/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
import * as EMIDIPort from '../EMIDIPort.ts'
import * as Util from '../Util.ts'

/**
 * @internal
 */
export const makeMIDIPortMethodCallerFactory =
  <TError = never>(
    method: 'close' | 'open',
    mapError: (id: EMIDIPort.BothId) => (err: unknown) => TError,
  ) =>
  <THighLevelPortType extends MIDIPortType>(
    is: (port: unknown) => port is EMIDIPort.EMIDIPort<THighLevelPortType>,
  ): TouchPort<TError, never, THighLevelPortType> =>
    Effect.fn(`EMIDIPort.${method}`)(function* <
      TPortType extends THighLevelPortType,
      E = never,
      R = never,
    >(polymorphicPort: EMIDIPort.PolymorphicPort<E, R, TPortType>) {
      const port = yield* Util.fromPolymorphic(
        polymorphicPort,
        is as unknown as (
          port: unknown,
        ) => port is EMIDIPort.EMIDIPort<TPortType>,
      )

      yield* Effect.annotateCurrentSpan({
        method,
        port: Util.getStaticMIDIPortInfo(port),
      })

      yield* Effect.tryPromise({
        try: () => EMIDIPort.assumeImpl(port)._port[method](),
        catch: mapError(port.id),
      })

      return port
    })

export interface TouchPort<
  TAdditionalError,
  TAdditionalRequirement,
  THighLevelPortType extends MIDIPortType,
> {
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
    TPortGettingError | TAdditionalError,
    TPortGettingRequirement | TAdditionalRequirement
  >
}
