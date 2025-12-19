/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
import * as EffectfulMIDIPort from '../../EffectfulMIDIPort.ts'
import {
  fromPolymorphic,
  getStaticMIDIPortInfo,
  type MIDIBothPortId,
} from '../../util.ts'

/**
 * @internal
 */
export const makeMIDIPortMethodCallerFactory =
  <TError = never>(
    method: 'close' | 'open',
    mapError: (portId: MIDIBothPortId) => (err: unknown) => TError,
  ) =>
  <THighLevelPortType extends MIDIPortType>(
    is: (
      port: unknown,
    ) => port is EffectfulMIDIPort.EffectfulMIDIPort<THighLevelPortType>,
  ): {
    /**
     * @returns An effect with the same port for easier chaining of operations
     */
    <TPortType extends THighLevelPortType, E = never, R = never>(
      polymorphicPort: EffectfulMIDIPort.PolymorphicPort<E, R, TPortType>,
    ): Effect.Effect<
      EffectfulMIDIPort.EffectfulMIDIPort<TPortType>,
      TError | E,
      R
    >
  } =>
    Effect.fn(`EffectfulMIDIPort.${method}`)(function* <
      TPortType extends THighLevelPortType,
      E = never,
      R = never,
    >(polymorphicPort: EffectfulMIDIPort.PolymorphicPort<E, R, TPortType>) {
      const port = yield* fromPolymorphic(
        polymorphicPort,
        is as unknown as (
          port: unknown,
        ) => port is EffectfulMIDIPort.EffectfulMIDIPort<TPortType>,
      )

      yield* Effect.annotateCurrentSpan({
        method,
        port: getStaticMIDIPortInfo(port),
      })

      yield* Effect.tryPromise({
        try: () => EffectfulMIDIPort.assumeImpl(port)._port[method](),
        catch: mapError(port.id),
      })

      return port
    })
