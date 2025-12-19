/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
import { dual, flow } from 'effect/Function'
import * as EffectfulMIDIAccess from '../EffectfulMIDIAccess.ts'
import * as EffectfulMIDIInputPort from '../EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from '../EffectfulMIDIOutputPort.ts'
import { PortNotFoundError } from '../errors.ts'
import type {
  MIDIBothPortId,
  MIDIInputPortId,
  MIDIOutputPortId,
} from '../util.ts'

/**
 *
 * @internal
 */
export const getPortByIdAndRemap =
  <TPortType extends MIDIBothPortId>() =>
  <OnInput, OnOutput>(handlers: {
    onInputFound: (rawInputPort: MIDIInput) => Effect.Effect<OnInput>
    onOutputFound: (rawOutputPort: MIDIOutput) => Effect.Effect<OnOutput>
  }): GetPortById<TPortType, OnInput, OnOutput> =>
    dual(2, (polymorphicAccess, portId) =>
      Effect.flatMap(EffectfulMIDIAccess.resolve(polymorphicAccess), e => {
        const rawAccess = EffectfulMIDIAccess.assumeImpl(e)._access

        let rawPort: MIDIOutput | MIDIInput | undefined =
          rawAccess.inputs.get(portId)

        if (rawPort) return handlers.onInputFound(rawPort)

        rawPort = rawAccess.outputs.get(portId)

        if (rawPort) return handlers.onOutputFound(rawPort)

        return new PortNotFoundError({
          portId: portId,
        }) as PortTaken<OnInput, OnOutput>
      }),
    )

/**
 *
 *
 */
export const getPortByPortIdAndAccess = getPortByIdAndRemap<MIDIBothPortId>()({
  onInputFound: flow(EffectfulMIDIInputPort.make, Effect.succeed),
  onOutputFound: flow(EffectfulMIDIOutputPort.make, Effect.succeed),
})

/**
 *
 *
 */
export const getInputPortByPortIdAndAccess =
  getPortByIdAndRemap<MIDIInputPortId>()({
    onInputFound: flow(EffectfulMIDIInputPort.make, Effect.succeed),
    onOutputFound: rawOutputPort =>
      Effect.dieMessage(
        `Assertion failed: getInputPortById found output port with the id=${rawOutputPort.id}`,
      ),
  })

/**
 *
 *
 */
export const getOutputPortByPortIdAndAccess =
  getPortByIdAndRemap<MIDIOutputPortId>()({
    onInputFound: rawInputPort =>
      Effect.dieMessage(
        `Assertion failed: getOutputPortById found output port with the id=${rawInputPort.id}`,
      ),
    onOutputFound: flow(EffectfulMIDIOutputPort.make, Effect.succeed),
  })

/**
 *
 *
 */
export interface GetPortById<TPortType, OnInput, OnOutput>
  extends GetPortByIdAccessFirst<TPortType, OnInput, OnOutput>,
    GetPortByIdAccessLast<TPortType, OnInput, OnOutput> {}

/**
 *
 *
 */
export interface GetPortByIdAccessFirst<TPortType, OnInput, OnOutput> {
  <E = never, R = never>(
    polymorphicAccess: EffectfulMIDIAccess.PolymorphicAccessInstance<E, R>,
    portId: TPortType,
  ): PortTaken<OnInput, OnOutput, E, R>
}

/**
 *
 *
 */
export interface GetPortByIdAccessLast<TPortType, OnInput, OnOutput> {
  (
    portId: TPortType,
  ): {
    <E = never, R = never>(
      polymorphicAccess: EffectfulMIDIAccess.PolymorphicAccessInstance<E, R>,
    ): PortTaken<OnInput, OnOutput, E, R>
  }
}

/**
 *
 *
 */
export type PortTaken<OnInput, OnOutput, E = never, R = never> = Effect.Effect<
  OnInput | OnOutput,
  E | PortNotFoundError,
  R
>
