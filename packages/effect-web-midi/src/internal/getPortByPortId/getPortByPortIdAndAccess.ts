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
  <
    AInputPort,
    AOutputPort,
    EInputPort,
    EOutputPort,
    RInputPort,
    ROutputPort,
  >(handlers: {
    onInputFound: (
      rawInputPort: MIDIInput,
    ) => Effect.Effect<AInputPort, EInputPort, RInputPort>
    onOutputFound: (
      rawOutputPort: MIDIOutput,
    ) => Effect.Effect<AOutputPort, EOutputPort, ROutputPort>
  }): GetPortById<
    TPortType,
    AInputPort | AOutputPort,
    EInputPort | EOutputPort,
    RInputPort | ROutputPort
  > =>
    dual(2, (polymorphicAccess, portId) =>
      Effect.flatMap(EffectfulMIDIAccess.resolve(polymorphicAccess), e => {
        const rawAccess = EffectfulMIDIAccess.assumeImpl(e)._access

        let rawPort: MIDIOutput | MIDIInput | undefined =
          rawAccess.inputs.get(portId)

        if (rawPort) return handlers.onInputFound(rawPort)

        rawPort = rawAccess.outputs.get(portId)

        if (rawPort) return handlers.onOutputFound(rawPort)

        return new PortNotFoundError({ portId }) as PortTaken<
          AInputPort | AOutputPort,
          never,
          never,
          EInputPort | EOutputPort,
          RInputPort | ROutputPort
        >
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
export interface GetPortById<
  TPortId extends MIDIBothPortId,
  APort,
  EPort,
  RPort,
> extends GetPortByIdAccessFirst<TPortId, APort, EPort, RPort>,
    GetPortByIdAccessLast<TPortId, APort, EPort, RPort> {}

export interface GetPortByIdAccessFirst<
  TPortId extends MIDIBothPortId,
  APort,
  EPort,
  RPort,
> {
  /**
   *
   *
   */
  <EAccess = never, RAccess = never>(
    polymorphicAccess: EffectfulMIDIAccess.PolymorphicAccessInstance<
      EAccess,
      RAccess
    >,
    portId: TPortId,
  ): PortTaken<APort, EAccess, RAccess, EPort, RPort>
}

export interface GetPortByIdAccessLast<
  TPortId extends MIDIBothPortId,
  APort,
  EPort,
  RPort,
> {
  /**
   *
   *
   */
  (portId: TPortId): GetPortByIdAccessLastSecondHalf<APort, EPort, RPort>
}

export interface GetPortByIdAccessLastSecondHalf<APort, EPort, RPort> {
  /**
   *
   *
   */
  <EAccess = never, RAccess = never>(
    polymorphicAccess: EffectfulMIDIAccess.PolymorphicAccessInstance<
      EAccess,
      RAccess
    >,
  ): PortTaken<APort, EAccess, RAccess, EPort, RPort>
}

export type PortTaken<APort, EAccess, RAccess, EPort, RPort> = Effect.Effect<
  APort,
  EAccess | EPort | PortNotFoundError,
  RAccess | RPort
>
