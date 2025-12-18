/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
import * as EffectfulMIDIPort from '../../EffectfulMIDIPort.ts'
import { fromPolymorphic, getStaticMIDIPortInfo } from '../../util.ts'

/**
 * @internal
 */
export const MIDIPortMethodCallerFactory =
  <TError = never>(
    method: 'close' | 'open',
    mapError: (err: unknown) => TError,
  ) =>
  <THighLevelType extends MIDIPortType>(
    is: (
      port: unknown,
    ) => port is EffectfulMIDIPort.EffectfulMIDIPort<THighLevelType>,
  ): {
    /**
     * @returns An effect with the same port for easier chaining of operations
     */
    <TType extends THighLevelType, E = never, R = never>(
      polymorphicPort: EffectfulMIDIPort.PolymorphicPort<E, R, TType>,
    ): Effect.Effect<EffectfulMIDIPort.EffectfulMIDIPort<TType>, TError | E, R>
  } =>
    Effect.fn(`EffectfulMIDIPort.${method}`)(function* <
      TType extends THighLevelType,
      E = never,
      R = never,
    >(polymorphicPort: EffectfulMIDIPort.PolymorphicPort<E, R, TType>) {
      const port = yield* fromPolymorphic(
        polymorphicPort,
        is as unknown as (
          port: unknown,
        ) => port is EffectfulMIDIPort.EffectfulMIDIPort<TType>,
      )

      yield* Effect.annotateCurrentSpan({
        method,
        port: getStaticMIDIPortInfo(port),
      })

      yield* Effect.tryPromise({
        try: () => EffectfulMIDIPort.assumeImpl(port)._port[method](),
        catch: mapError,
      })

      return port
    })
