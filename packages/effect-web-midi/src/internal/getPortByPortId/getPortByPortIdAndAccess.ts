/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
import { dual, flow } from 'effect/Function'
import * as EffectfulMIDIAccess from '../EffectfulMIDIAccess.ts'
import * as EffectfulMIDIInputPort from '../EffectfulMIDIInputPort.ts'
import * as EffectfulMIDIOutputPort from '../EffectfulMIDIOutputPort.ts'
import { PortNotFoundError } from '../errors.ts'
import type {
  FallbackOnUnknownOrAny,
  MIDIBothPortId,
  MIDIInputPortId,
  MIDIOutputPortId,
  MIDIPortId,
} from '../util.ts'
import * as EffectfulMIDIPort from '../EffectfulMIDIPort.ts'

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
    // TPortType extends MIDIPortType,
    // TAccessGettingFallbackError,
    // TAccessGettingFallbackRequirement,
    // TAdditionalError,
    // TAdditionalRequirement,
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

        return new PortNotFoundError({ portId }) as AcquiredPort<
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

export interface GetPortById<
  TPortType extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortId<
    EffectfulMIDIPort.EffectfulMIDIPort<TPortType>,
    TPortType,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  > {}

export interface GetPortByIdAccessFirst<
  TPortType extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessFirst<
    EffectfulMIDIPort.EffectfulMIDIPort<TPortType>,
    TPortType,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  > {}

export interface GetPortByIdAccessLast<
  TPortType extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessLast<
    EffectfulMIDIPort.EffectfulMIDIPort<TPortType>,
    TPortType,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  > {}

export interface GetPortByIdAccessLastSecondHalf<
  TPortType extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessLastSecondHalf<
    EffectfulMIDIPort.EffectfulMIDIPort<TPortType>,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  > {}

export interface AcquiredPort<
  TPortType extends MIDIPortType,
  TAccessGettingError,
  TAccessGettingRequirement,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends AcquiredThing<
    EffectfulMIDIPort.EffectfulMIDIPort<TPortType>,
    TAccessGettingError,
    TAccessGettingRequirement,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  > {}

// =======================================
// =======================================
// =======================================

export interface GetThingByPortId<
  TSuccess,
  TPortType extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends GetThingByPortIdAccessFirst<
      TSuccess,
      TPortType,
      TAccessGettingFallbackError,
      TAccessGettingFallbackRequirement,
      TAdditionalError,
      TAdditionalRequirement
    >,
    GetThingByPortIdAccessLast<
      TSuccess,
      TPortType,
      TAccessGettingFallbackError,
      TAccessGettingFallbackRequirement,
      TAdditionalError,
      TAdditionalRequirement
    > {}

export interface GetThingByPortIdAccessFirst<
  TSuccess,
  TPortType extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> {
  /**
   *
   *
   */
  <TAccessGettingError = never, TAccessGettingRequirement = never>(
    polymorphicAccess: EffectfulMIDIAccess.PolymorphicAccessInstance<
      TAccessGettingError,
      TAccessGettingRequirement
    >,
    portId: MIDIPortId<TPortType>,
  ): AcquiredThing<
    TSuccess,
    TAccessGettingError,
    TAccessGettingRequirement,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  >
}

export interface GetThingByPortIdAccessLast<
  TSuccess,
  TPortType extends MIDIPortType,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> {
  /**
   *
   *
   */
  (
    portId: MIDIPortId<TPortType>,
  ): GetThingByPortIdAccessLastSecondHalf<
    TSuccess,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  >
}

export interface GetThingByPortIdAccessLastSecondHalf<
  TSuccess,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> {
  /**
   *
   *
   */
  <TAccessGettingError = never, TAccessGettingRequirement = never>(
    polymorphicAccess: EffectfulMIDIAccess.PolymorphicAccessInstance<
      TAccessGettingError,
      TAccessGettingRequirement
    >,
  ): AcquiredThing<
    TSuccess,
    TAccessGettingError,
    TAccessGettingRequirement,
    TAccessGettingFallbackError,
    TAccessGettingFallbackRequirement,
    TAdditionalError,
    TAdditionalRequirement
  >
}

export interface AcquiredThing<
  TSuccess,
  TAccessGettingError,
  TAccessGettingRequirement,
  TAccessGettingFallbackError,
  TAccessGettingFallbackRequirement,
  TAdditionalError,
  TAdditionalRequirement,
> extends Effect.Effect<
    TSuccess,
    | FallbackOnUnknownOrAny<TAccessGettingError, TAccessGettingFallbackError>
    | TAdditionalError
    | PortNotFoundError,
    | FallbackOnUnknownOrAny<
        TAccessGettingRequirement,
        TAccessGettingFallbackRequirement
      >
    | TAdditionalRequirement
  > {}
